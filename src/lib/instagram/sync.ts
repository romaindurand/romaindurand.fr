import {
	RateLimitedError,
	SessionExpiredError,
	type IgItem,
	type IgPage,
	type IgSource,
	type InstagramClient
} from './types';

/** `new` : les éléments récents ; `older` : reprendre derrière le plus ancien déjà récupéré. */
export type SyncMode = 'new' | 'older';

export interface SyncConfig {
	mode: SyncMode;
	/** Éléments *nouveaux dans le registre* récupérés au plus par exécution (sources « à rebours »). */
	limit: number;
	maxRequests: number;
	minDelayMs: number;
	maxDelayMs: number;
	pauseMs: number;
}

/** Position mémorisée d'une source : où reprendre « plus ancien », et s'il en reste. */
export interface SourceState {
	oldestCursor: string | null;
	hasMoreOlder: boolean;
}

/** Registre d'ingestion : indépendant des articles (un brouillon supprimé n'en sort pas). */
export interface Registry {
	getSourceState(key: string): Promise<SourceState | null>;
	saveSourceState(key: string, state: SourceState): Promise<void>;
	hasItem(pk: string): Promise<boolean>;
	hasItemSource(pk: string, source: string): Promise<boolean>;
	addItemSource(pk: string, source: string): Promise<void>;
	/** Ajoute des tags au post de l'élément s'il existe encore ; sans effet sinon. */
	addTagsToPost(pk: string, tags: string[]): Promise<void>;
}

/** Crée le brouillon, les médias et la ligne de registre d'un élément nouveau. */
export interface Ingestor {
	ingest(item: IgItem, tags: string[]): Promise<void>;
}

/** Suivi de progression, arrêt demandé. */
export interface Tracker {
	setTotal(total: number): Promise<void>;
	progress(done: number, current: string): Promise<void>;
	event(message: string): Promise<void>;
	shouldStop(): Promise<boolean>;
}

export interface SyncDeps {
	client: InstagramClient;
	registry: Registry;
	ingestor: Ingestor;
	tracker: Tracker;
	sleep(ms: number): Promise<void>;
	random(): number;
	now(): Date;
}

export type SyncOutcome =
	'completed' | 'limit' | 'stopped' | 'request-cap' | 'session-expired' | 'rate-limited';

export interface SyncResult {
	outcome: SyncOutcome;
	created: number;
	tagged: number;
	skipped: number;
	requests: number;
	warnings: string[];
	blockedUntil?: Date;
}

interface Task {
	source: IgSource;
	direction: 'newer' | 'older';
	cursor: string | null;
	done: boolean;
}

/**
 * Parcourt les sources en alternance, page par page.
 * Source sans état : parcours « à rebours » depuis le haut, borné par `limit`.
 * Mode `new` : du haut jusqu'au premier élément déjà connu pour la source, sans limite.
 * Mode `older` : reprise à `oldestCursor`, bornée par `limit`.
 */
export async function runSync(config: SyncConfig, deps: SyncDeps): Promise<SyncResult> {
	const { client, registry, ingestor, tracker } = deps;
	const result: SyncResult = {
		outcome: 'completed',
		created: 0,
		tagged: 0,
		skipped: 0,
		requests: 0,
		warnings: []
	};
	const tasks: Task[] = [];
	let firstRequest = true;

	const throttled = async <T>(call: () => Promise<T>): Promise<T> => {
		if (!firstRequest) {
			await deps.sleep(config.minDelayMs + deps.random() * (config.maxDelayMs - config.minDelayMs));
		}
		firstRequest = false;
		result.requests++;
		return call();
	};

	const finish = (): SyncResult => {
		for (const task of tasks) {
			if (task.direction === 'newer' && !task.done) {
				result.warnings.push(
					`Parcours interrompu avant les éléments déjà connus (${task.source.key}) : des éléments récents peuvent manquer.`
				);
			}
		}
		return result;
	};

	const processPage = async (task: Task, page: IgPage): Promise<'ok' | 'stopped'> => {
		const { key, tags } = task.source;
		for (const item of page.items) {
			if (await registry.hasItemSource(item.pk, key)) {
				if (task.direction === 'newer') {
					task.done = true;
					return 'ok';
				}
				result.skipped++;
				continue;
			}
			if (await registry.hasItem(item.pk)) {
				await registry.addTagsToPost(item.pk, tags);
				result.tagged++;
			} else {
				if (task.direction === 'older' && result.created >= config.limit) {
					await registry.saveSourceState(key, { oldestCursor: task.cursor, hasMoreOlder: true });
					task.done = true;
					result.outcome = 'limit';
					return 'ok';
				}
				if (await tracker.shouldStop()) return 'stopped';
				await ingestor.ingest(item, tags);
				result.created++;
				await tracker.progress(result.created, `@${item.author}`);
				await tracker.event(`Nouveau : @${item.author} (${key})`);
			}
			await registry.addItemSource(item.pk, key);
		}
		task.cursor = page.nextCursor;
		if (task.direction === 'older') {
			await registry.saveSourceState(key, {
				oldestCursor: page.nextCursor,
				hasMoreOlder: page.nextCursor !== null
			});
		}
		if (page.nextCursor === null) task.done = true;
		return 'ok';
	};

	try {
		const sources = await throttled(() => client.listSources());
		for (const source of sources) {
			const state = await registry.getSourceState(source.key);
			if (state === null) {
				tasks.push({ source, direction: 'older', cursor: null, done: false });
			} else if (config.mode === 'new') {
				tasks.push({ source, direction: 'newer', cursor: null, done: false });
			} else if (state.hasMoreOlder) {
				tasks.push({ source, direction: 'older', cursor: state.oldestCursor, done: false });
			}
		}
		await tracker.setTotal(tasks.some((task) => task.direction === 'older') ? config.limit : 0);

		while (tasks.some((task) => !task.done)) {
			for (const task of tasks) {
				if (task.done) continue;
				if (task.direction === 'older' && result.created >= config.limit) {
					task.done = true;
					result.outcome = 'limit';
					continue;
				}
				if (await tracker.shouldStop()) {
					result.outcome = 'stopped';
					return finish();
				}
				if (result.requests >= config.maxRequests) {
					result.outcome = 'request-cap';
					return finish();
				}
				const page = await throttled(() => client.fetchPage(task.source.key, task.cursor));
				if ((await processPage(task, page)) === 'stopped') {
					result.outcome = 'stopped';
					return finish();
				}
			}
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
	return finish();
}
