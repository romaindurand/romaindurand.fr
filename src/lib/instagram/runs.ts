import { prisma } from '#lib/prisma.js';
import type { Prisma } from '../../../generated/prisma/client';
import type { Tracker } from './sync';

/** Un job dont le heartbeat a plus de 15 min est considéré mort et son verrou repris. */
export const LOCK_STALE_MS = 15 * 60 * 1000;
const SAMPLE_WINDOW = 20;
const MAX_EVENTS = 50;

export type RunKind = 'sync-new' | 'sync-older' | 'scan' | 'media';
export type RunStatus = 'running' | 'done' | 'stopped' | 'failed';

/** Prend le verrou : crée un `SyncRun`, ou renvoie `null` si un job vivant tourne déjà. */
export function acquireRun(kind: RunKind, now = new Date()) {
	return prisma.$transaction(async (tx) => {
		const running = await tx.syncRun.findMany({ where: { status: 'running' } });
		if (running.some((run) => now.getTime() - run.heartbeatAt.getTime() < LOCK_STALE_MS)) {
			return null;
		}
		await tx.syncRun.updateMany({
			where: { status: 'running' },
			data: {
				status: 'failed',
				finishedAt: now,
				result: JSON.stringify({ error: 'Interrompu (verrou périmé)' })
			}
		});
		return tx.syncRun.create({ data: { kind, startedAt: now, heartbeatAt: now } });
	});
}

/** Écrit la progression d'un job dans sa ligne `SyncRun`. */
export class RunTracker implements Tracker {
	private samples: [number, number][] = [];
	private events: { t: number; message: string }[] = [];

	constructor(
		private runId: number,
		private now: () => Date = () => new Date()
	) {}

	/** N'écrit que si le run est encore `running` (un run repris comme périmé n'est pas écrasé). */
	private async patch(data: Prisma.SyncRunUpdateManyMutationInput) {
		await prisma.syncRun.updateMany({
			where: { id: this.runId, status: 'running' },
			data: { ...data, heartbeatAt: this.now() }
		});
	}

	/** Rafraîchit uniquement le heartbeat (longue opération silencieuse). */
	async beat() {
		await this.patch({});
	}

	async setTotal(total: number) {
		await this.patch({ total });
	}

	async progress(done: number, current: string) {
		this.samples = [...this.samples, [this.now().getTime(), done] as [number, number]].slice(
			-SAMPLE_WINDOW
		);
		await this.patch({ done, current, samples: JSON.stringify(this.samples) });
	}

	async event(message: string) {
		this.events = [...this.events, { t: this.now().getTime(), message }].slice(-MAX_EVENTS);
		await this.patch({ events: JSON.stringify(this.events) });
	}

	async shouldStop() {
		const run = await prisma.syncRun.findUnique({
			where: { id: this.runId },
			select: { stopRequested: true, status: true }
		});
		return !run || run.status !== 'running' || run.stopRequested;
	}
}

/** Termine un job (libère le verrou) ; sans effet si le run n'est plus `running`. */
export async function finishRun(
	runId: number,
	status: Exclude<RunStatus, 'running'>,
	result: unknown,
	now = new Date()
) {
	await prisma.syncRun.updateMany({
		where: { id: runId, status: 'running' },
		data: { status, finishedAt: now, heartbeatAt: now, result: JSON.stringify(result) }
	});
}

/** Demande l'arrêt du job en cours ; `false` s'il n'y en a pas. */
export async function requestStop() {
	const { count } = await prisma.syncRun.updateMany({
		where: { status: 'running' },
		data: { stopRequested: true }
	});
	return count > 0;
}

/**
 * Vitesse (éléments/min) et temps restant d'après les derniers échantillons `[timestamp ms, done]`.
 * La fenêtre se termine à `nowMs` : une pause ralentit l'estimation.
 */
export function estimate(samples: [number, number][], total: number, nowMs: number) {
	if (samples.length < 2) return null;
	const [startTime, startDone] = samples[0];
	const [lastTime, lastDone] = samples[samples.length - 1];
	const minutes = (Math.max(lastTime, nowMs) - startTime) / 60_000;
	if (minutes <= 0 || lastDone <= startDone) return null;
	const ratePerMin = (lastDone - startDone) / minutes;
	const remainingMs =
		total > lastDone ? ((total - lastDone) / ratePerMin) * 60_000 : total > 0 ? 0 : null;
	return { ratePerMin, remainingMs };
}

/** État d'un job tel que l'admin l'affiche. */
export interface RunView {
	id: number;
	kind: string;
	status: string;
	phase: string;
	total: number;
	done: number;
	current: string;
	startedAt: string;
	finishedAt: string | null;
	stopRequested: boolean;
	result: unknown;
	events: { t: number; message: string }[];
	ratePerMin: number | null;
	remainingMs: number | null;
}

const parse = <T>(json: string, fallback: T): T => {
	try {
		return JSON.parse(json) as T;
	} catch {
		return fallback;
	}
};

/**
 * Le dernier job (en cours ou terminé), ou `null`. Un job `running` sans heartbeat depuis
 * `LOCK_STALE_MS` est présenté comme `failed`.
 */
export async function getCurrentRun(now = new Date()): Promise<RunView | null> {
	const run = await prisma.syncRun.findFirst({ orderBy: { id: 'desc' } });
	if (!run) return null;
	const dead =
		run.status === 'running' && now.getTime() - run.heartbeatAt.getTime() >= LOCK_STALE_MS;
	const eta =
		run.status === 'running' && !dead
			? estimate(parse<[number, number][]>(run.samples, []), run.total, now.getTime())
			: null;
	return {
		id: run.id,
		kind: run.kind,
		status: dead ? 'failed' : run.status,
		phase: run.phase,
		total: run.total,
		done: run.done,
		current: run.current,
		startedAt: run.startedAt.toISOString(),
		finishedAt: run.finishedAt?.toISOString() ?? null,
		stopRequested: run.stopRequested,
		result: dead ? { error: 'Interrompu (aucun signe de vie)' } : parse<unknown>(run.result, {}),
		events: parse(run.events, []),
		ratePerMin: eta?.ratePerMin ?? null,
		remainingMs: eta?.remainingMs ?? null
	};
}
