import { HttpInstagramClient } from './client';
import { fetchWithTimeout } from './http';
import { runRecovery, runScan } from './media-jobs';
import { PrismaIngestor, PrismaRegistry } from './registry';
import { RunTracker, acquireRun, finishRun, type RunKind } from './runs';
import { getSession, getSettings, loadCookies, setBlockedUntil, setStatus } from './session';
import { runSync } from './sync';

/** Pause imposée après un ralentissement demandé par Instagram. */
export const PAUSE_MS = 6 * 60 * 60 * 1000;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 6000;

/** Le job ne peut pas démarrer : 409 (déjà en cours) ou 412 (session invalide, pause active). */
export class JobRejected extends Error {
	name = 'JobRejected';
	constructor(
		readonly status: 409 | 412,
		message: string
	) {
		super(message);
	}
}

export interface JobEnv {
	mediaDir: string;
	secret: string;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Vérifie les garde-fous, prend le verrou, puis exécute le job en arrière-plan.
 * Renvoie l'id du `SyncRun` ; la progression se lit dans cette ligne.
 */
export async function startJob(
	kind: RunKind,
	env: JobEnv,
	opts: { postId?: number } = {}
): Promise<number> {
	if (kind !== 'scan') {
		const session = await getSession();
		if (session.status !== 'ok') {
			throw new JobRejected(
				412,
				'Session Instagram invalide : renouvelez-la depuis /admin/instagram'
			);
		}
		if (session.blockedUntil && session.blockedUntil > new Date()) {
			throw new JobRejected(
				412,
				`Pause anti-blocage jusqu'à ${session.blockedUntil.toISOString()}`
			);
		}
	}
	const run = await acquireRun(kind);
	if (!run) throw new JobRejected(409, 'Une opération est déjà en cours');
	execute(run.id, kind, env, opts).catch((error) => console.error('Job Instagram', error));
	return run.id;
}

async function execute(runId: number, kind: RunKind, env: JobEnv, opts: { postId?: number }) {
	const tracker = new RunTracker(runId);
	// une opération silencieuse (gros téléchargement) ne doit pas laisser périmer son verrou
	const heartbeat = setInterval(() => void tracker.beat().catch(() => {}), 60_000);
	try {
		if (kind === 'scan') {
			await finishRun(runId, 'done', await runScan({ mediaDir: env.mediaDir, tracker }));
			return;
		}
		const settings = await getSettings();
		const cookies = await loadCookies(env.secret);
		if (!cookies) {
			await setStatus('expired');
			await finishRun(runId, 'failed', { outcome: 'session-expired', error: 'Cookies illisibles' });
			return;
		}
		const client = new HttpInstagramClient(cookies, { settings });
		const common = {
			minDelayMs: MIN_DELAY_MS,
			maxDelayMs: MAX_DELAY_MS,
			maxRequests: settings.maxRequests,
			pauseMs: PAUSE_MS
		};
		const deps = { client, tracker, sleep, random: Math.random, now: () => new Date() };
		const result =
			kind === 'media'
				? await runRecovery(
						{ ...common, limit: settings.mediaBatchSize, postId: opts.postId },
						{ ...deps, mediaDir: env.mediaDir, fetchFn: fetchWithTimeout(300_000) }
					)
				: await runSync(
						{
							...common,
							mode: kind === 'sync-new' ? 'new' : 'older',
							limit: settings.batchSize
						},
						{ ...deps, registry: new PrismaRegistry(), ingestor: new PrismaIngestor(env.mediaDir) }
					);
		if (result.outcome === 'session-expired') await setStatus('expired');
		if (result.outcome === 'rate-limited' && result.blockedUntil) {
			await setBlockedUntil(result.blockedUntil);
		}
		const failed = result.outcome === 'session-expired' || result.outcome === 'rate-limited';
		await finishRun(
			runId,
			result.outcome === 'stopped' ? 'stopped' : failed ? 'failed' : 'done',
			result
		);
	} catch (error) {
		await finishRun(runId, 'failed', {
			outcome: 'error',
			error: error instanceof Error ? error.message : String(error)
		});
	} finally {
		clearInterval(heartbeat);
	}
}
