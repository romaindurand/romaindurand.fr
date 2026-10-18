import { prisma } from '#lib/prisma.js';
import { downloadTo, fileExists } from './media-storage';
import type { Tracker } from './sync';
import { RateLimitedError, SessionExpiredError, type InstagramClient } from './types';

export interface ScanResult {
	checked: number;
	missing: number;
	restored: number;
}

/** Teste l'existence des fichiers de chaque média et bascule `ok` ↔ `missing` (garde `unavailable`). */
export async function runScan(deps: { mediaDir: string; tracker: Tracker }): Promise<ScanResult> {
	const { mediaDir, tracker } = deps;
	await tracker.setTotal(await prisma.postMedia.count());
	const result: ScanResult = { checked: 0, missing: 0, restored: 0 };
	let lastId = 0;
	for (;;) {
		const rows = await prisma.postMedia.findMany({
			where: { id: { gt: lastId } },
			orderBy: { id: 'asc' },
			take: 200
		});
		if (rows.length === 0) break;
		for (const row of rows) {
			const present =
				(await fileExists(mediaDir, row.path)) &&
				(!row.posterPath || (await fileExists(mediaDir, row.posterPath)));
			const next = present ? 'ok' : row.status === 'unavailable' ? 'unavailable' : 'missing';
			if (next !== row.status) {
				await prisma.postMedia.update({
					where: { id: row.id },
					data: { status: next, ...(present ? { unavailableReason: null } : {}) }
				});
				if (present) result.restored++;
				else result.missing++;
			}
			result.checked++;
			if (result.checked % 50 === 0) await tracker.progress(result.checked, 'vérification');
			lastId = row.id;
		}
	}
	await tracker.progress(result.checked, 'terminé');
	return result;
}

export interface RecoveryConfig {
	/** Nombre maximal de posts traités par exécution. */
	limit: number;
	/** Un seul post : retente aussi les médias `unavailable`. */
	postId?: number;
	minDelayMs: number;
	maxDelayMs: number;
	maxRequests: number;
	pauseMs: number;
}

export interface RecoveryDeps {
	client: InstagramClient;
	mediaDir: string;
	tracker: Tracker;
	sleep(ms: number): Promise<void>;
	random(): number;
	now(): Date;
	fetchFn?: typeof fetch;
}

export interface RecoveryResult {
	outcome: 'completed' | 'stopped' | 'request-cap' | 'session-expired' | 'rate-limited';
	posts: number;
	recovered: number;
	unavailable: number;
	failed: number;
	requests: number;
	blockedUntil?: Date;
}

/** Retélécharge les médias manquants depuis des URLs fraîches (les anciennes expirent). */
export async function runRecovery(
	config: RecoveryConfig,
	deps: RecoveryDeps
): Promise<RecoveryResult> {
	const { client, mediaDir, tracker } = deps;
	const statuses = config.postId ? ['missing', 'unavailable'] : ['missing'];
	const groups = await prisma.postMedia.groupBy({
		by: ['postId'],
		where: { status: { in: statuses }, ...(config.postId ? { postId: config.postId } : {}) },
		orderBy: { postId: 'asc' },
		take: config.limit
	});
	const result: RecoveryResult = {
		outcome: 'completed',
		posts: groups.length,
		recovered: 0,
		unavailable: 0,
		failed: 0,
		requests: 0
	};
	await tracker.setTotal(groups.length);

	const markUnavailable = async (ids: number[], reason: string) => {
		await prisma.postMedia.updateMany({
			where: { id: { in: ids } },
			data: { status: 'unavailable', unavailableReason: reason }
		});
		result.unavailable += ids.length;
	};

	try {
		for (const [index, { postId }] of groups.entries()) {
			if (await tracker.shouldStop()) {
				result.outcome = 'stopped';
				break;
			}
			if (result.requests >= config.maxRequests) {
				result.outcome = 'request-cap';
				break;
			}
			const rows = await prisma.postMedia.findMany({
				where: { postId, status: { in: statuses } }
			});
			const ids = rows.map((row) => row.id);
			const source = await prisma.instagramItem.findUnique({ where: { postId } });
			if (!source) {
				await markUnavailable(ids, 'sans source');
			} else {
				if (result.requests > 0) {
					await deps.sleep(
						config.minDelayMs + deps.random() * (config.maxDelayMs - config.minDelayMs)
					);
				}
				result.requests++;
				const item = await client.fetchItem(source.pk);
				if (!item) {
					await markUnavailable(ids, 'publication supprimée ou privée');
				} else {
					for (const row of rows) {
						const media = item.media.find((entry) => entry.index === row.sourceIndex);
						if (!media) {
							await markUnavailable([row.id], 'média absent de la publication');
							continue;
						}
						try {
							await downloadTo(mediaDir, row.path, media.url, deps.fetchFn);
							if (row.posterPath && media.posterUrl) {
								await downloadTo(mediaDir, row.posterPath, media.posterUrl, deps.fetchFn);
							}
							await prisma.postMedia.update({
								where: { id: row.id },
								data: {
									status: 'ok',
									unavailableReason: null,
									posterPath: media.posterUrl ? row.posterPath : null
								}
							});
							result.recovered++;
						} catch (error) {
							result.failed++;
							await tracker.event(
								`Échec du téléchargement (post ${postId}) : ${error instanceof Error ? error.message : error}`
							);
						}
					}
				}
			}
			await tracker.progress(index + 1, `post ${postId}`);
		}
	} catch (error) {
		if (error instanceof SessionExpiredError) {
			result.outcome = 'session-expired';
		} else if (error instanceof RateLimitedError) {
			result.outcome = 'rate-limited';
			result.blockedUntil = new Date(deps.now().getTime() + config.pauseMs);
		} else {
			throw error;
		}
		await tracker.event(error.message || error.name);
	}
	return result;
}
