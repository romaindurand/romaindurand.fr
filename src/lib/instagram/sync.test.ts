import { describe, expect, it } from 'vitest';
import {
	runSync,
	type Ingestor,
	type Registry,
	type SourceState,
	type SyncConfig,
	type SyncDeps,
	type Tracker
} from './sync';
import {
	RateLimitedError,
	SessionExpiredError,
	type IgItem,
	type IgPage,
	type IgSource,
	type InstagramClient
} from './types';

const item = (pk: string, author = 'u'): IgItem => ({
	pk,
	code: pk,
	url: `https://x/${pk}`,
	author,
	caption: '',
	takenAt: new Date('2024-01-01'),
	type: 'image',
	media: []
});

type Feeds = Record<string, { tags: string[]; pages: IgItem[][] }>;

class FakeClient implements InstagramClient {
	fetched: Array<[string, string | null]> = [];
	failOn?: { call: number; error: Error };
	private calls = 0;
	constructor(private feeds: Feeds) {}
	async listSources(): Promise<IgSource[]> {
		this.calls++;
		return Object.entries(this.feeds).map(([key, feed]) => ({ key, tags: feed.tags }));
	}
	async fetchPage(source: string, cursor: string | null): Promise<IgPage> {
		this.calls++;
		if (this.failOn && this.calls === this.failOn.call) throw this.failOn.error;
		this.fetched.push([source, cursor]);
		const { pages } = this.feeds[source];
		const index = cursor === null ? 0 : Number(cursor);
		return {
			items: pages[index] ?? [],
			nextCursor: index + 1 < pages.length ? String(index + 1) : null
		};
	}
	async fetchItem(): Promise<IgItem | null> {
		return null;
	}
}

class FakeRegistry implements Registry {
	items = new Set<string>();
	itemSources = new Set<string>();
	states = new Map<string, SourceState>();
	tagged: Array<[string, string[]]> = [];
	async getSourceState(key: string) {
		return this.states.get(key) ?? null;
	}
	async saveSourceState(key: string, state: SourceState) {
		this.states.set(key, state);
	}
	async hasItem(pk: string) {
		return this.items.has(pk);
	}
	async hasItemSource(pk: string, source: string) {
		return this.itemSources.has(`${pk}|${source}`);
	}
	async addItemSource(pk: string, source: string) {
		this.itemSources.add(`${pk}|${source}`);
	}
	async addTagsToPost(pk: string, tags: string[]) {
		this.tagged.push([pk, tags]);
	}
	know(pk: string, ...sources: string[]) {
		this.items.add(pk);
		for (const source of sources) this.itemSources.add(`${pk}|${source}`);
	}
}

class FakeIngestor implements Ingestor {
	ingested: Array<{ pk: string; tags: string[] }> = [];
	failFor = new Set<string>();
	constructor(private registry: FakeRegistry) {}
	async ingest(item: IgItem, tags: string[]) {
		if (this.failFor.has(item.pk)) throw new Error(`échec ${item.pk}`);
		this.registry.items.add(item.pk);
		this.ingested.push({ pk: item.pk, tags });
	}
}

class FakeTracker implements Tracker {
	total = -1;
	progressed: number[] = [];
	events: string[] = [];
	stopAfterChecks = Infinity;
	private checks = 0;
	async setTotal(total: number) {
		this.total = total;
	}
	async progress(done: number) {
		this.progressed.push(done);
	}
	async event(message: string) {
		this.events.push(message);
	}
	async shouldStop() {
		this.checks++;
		return this.checks > this.stopAfterChecks;
	}
}

const config = (over: Partial<SyncConfig> = {}): SyncConfig => ({
	mode: 'new',
	limit: 100,
	maxRequests: 60,
	minDelayMs: 0,
	maxDelayMs: 0,
	pauseMs: 6 * 3600_000,
	...over
});

function setup(feeds: Feeds) {
	const client = new FakeClient(feeds);
	const registry = new FakeRegistry();
	const ingestor = new FakeIngestor(registry);
	const tracker = new FakeTracker();
	const sleeps: number[] = [];
	const deps: SyncDeps = {
		client,
		registry,
		ingestor,
		tracker,
		sleep: async (ms) => {
			sleeps.push(ms);
		},
		random: () => 0.5,
		now: () => new Date('2024-06-01T00:00:00Z')
	};
	return { client, registry, ingestor, tracker, sleeps, deps };
}

describe('initial run (sources without state)', () => {
	const feeds = (): Feeds => ({
		liked: {
			tags: ['like'],
			pages: [
				[item('l1'), item('l2')],
				[item('l3'), item('l4')]
			]
		},
		saved: { tags: ['saved'], pages: [[item('s1'), item('l1')], [item('s2')]] }
	});

	it('alternates sources page by page and counts distinct items against the limit', async () => {
		const { client, registry, ingestor, tracker, sleeps, deps } = setup(feeds());
		const result = await runSync(config({ limit: 4, minDelayMs: 2000, maxDelayMs: 6000 }), deps);

		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['l1', 'l2', 's1', 'l3']);
		expect(registry.tagged).toEqual([['l1', ['saved']]]);
		expect(result).toMatchObject({ outcome: 'limit', created: 4, tagged: 1, requests: 4 });
		expect(client.fetched).toEqual([
			['liked', null],
			['saved', null],
			['liked', '1']
		]);
		expect(registry.states.get('liked')).toEqual({ oldestCursor: '1', hasMoreOlder: true });
		expect(registry.states.get('saved')).toEqual({ oldestCursor: '1', hasMoreOlder: true });
		expect(tracker.total).toBe(4);
		expect(tracker.progressed).toEqual([1, 2, 3, 4]);
		expect(sleeps).toEqual([4000, 4000, 4000]);
	});

	it('records membership of every encountered item in its source', async () => {
		const { registry, deps } = setup(feeds());
		await runSync(config({ limit: 4 }), deps);
		expect(registry.itemSources.has('l1|liked')).toBe(true);
		expect(registry.itemSources.has('l1|saved')).toBe(true);
	});

	it('marks a source exhausted when its last page is reached', async () => {
		const { registry, deps } = setup({ liked: { tags: ['like'], pages: [[item('a')]] } });
		const result = await runSync(config(), deps);
		expect(result.outcome).toBe('completed');
		expect(registry.states.get('liked')).toEqual({ oldestCursor: null, hasMoreOlder: false });
	});

	it('keeps the page cursor when the limit is reached in the middle of a page, then resumes', async () => {
		const { registry, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('a'), item('b'), item('c')], [item('d')]] }
		});
		const first = await runSync(config({ mode: 'older', limit: 2 }), deps);
		expect(first.outcome).toBe('limit');
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['a', 'b']);
		expect(registry.states.get('liked')).toEqual({ oldestCursor: null, hasMoreOlder: true });

		const second = await runSync(config({ mode: 'older', limit: 2 }), deps);
		expect(second.outcome).toBe('completed');
		expect(second.skipped).toBe(2);
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['a', 'b', 'c', 'd']);
		expect(registry.states.get('liked')).toEqual({ oldestCursor: null, hasMoreOlder: false });
	});
});

describe('mode new (sources with state)', () => {
	it('walks from the top and stops at the first item known for the source, without any limit', async () => {
		const { registry, ingestor, tracker, deps } = setup({
			liked: {
				tags: ['like'],
				pages: [[item('n1'), item('n2'), item('k1'), item('k2')]]
			}
		});
		registry.know('k1', 'liked');
		registry.know('k2', 'liked');
		registry.states.set('liked', { oldestCursor: '5', hasMoreOlder: true });

		const result = await runSync(config({ mode: 'new', limit: 1 }), deps);
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['n1', 'n2']);
		expect(result).toMatchObject({ outcome: 'completed', created: 2, requests: 2, warnings: [] });
		expect(registry.states.get('liked')).toEqual({ oldestCursor: '5', hasMoreOlder: true });
		expect(tracker.total).toBe(0);
	});

	it('warns when the request cap interrupts the walk before known items', async () => {
		const { registry, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('n1')], [item('n2')], [item('n3')]] }
		});
		registry.states.set('liked', { oldestCursor: '9', hasMoreOlder: true });
		const result = await runSync(config({ maxRequests: 2 }), deps);
		expect(result.outcome).toBe('request-cap');
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['n1']);
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain('liked');
	});
});

describe('mode older (sources with state)', () => {
	it('resumes from the stored cursor, skipping items already known for the source', async () => {
		const { client, registry, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('a1')], [item('b1'), item('b2'), item('b3')]] }
		});
		registry.know('b1', 'liked');
		registry.states.set('liked', { oldestCursor: '1', hasMoreOlder: true });

		const result = await runSync(config({ mode: 'older', limit: 2 }), deps);
		expect(client.fetched).toEqual([['liked', '1']]);
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['b2', 'b3']);
		expect(result).toMatchObject({ outcome: 'completed', created: 2, skipped: 1 });
		expect(registry.states.get('liked')).toEqual({ oldestCursor: null, hasMoreOlder: false });
	});

	it('ignores sources that have nothing older', async () => {
		const { client, registry, deps } = setup({ liked: { tags: ['like'], pages: [[item('a')]] } });
		registry.states.set('liked', { oldestCursor: null, hasMoreOlder: false });
		const result = await runSync(config({ mode: 'older' }), deps);
		expect(client.fetched).toEqual([]);
		expect(result.created).toBe(0);
	});
});

describe('deduplication', () => {
	it('never recreates an item whose draft was deleted (registry row kept)', async () => {
		const { registry, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('gone'), item('fresh')]] }
		});
		registry.know('gone', 'liked');
		const result = await runSync(config(), deps);
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['fresh']);
		expect(result.skipped).toBe(1);
	});

	it('only adds the tag when the item is already known from another source', async () => {
		const { registry, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('other')]] }
		});
		registry.know('other', 'saved');
		const result = await runSync(config(), deps);
		expect(ingestor.ingested).toEqual([]);
		expect(registry.tagged).toEqual([['other', ['like']]]);
		expect(registry.itemSources.has('other|liked')).toBe(true);
		expect(result).toMatchObject({ created: 0, tagged: 1 });
	});
});

describe('failures and controls', () => {
	it('stops cleanly on an expired session, keeping the progress already saved', async () => {
		const { client, registry, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('a')], [item('b')]] }
		});
		client.failOn = { call: 3, error: new SessionExpiredError('login_required') };
		const result = await runSync(config({ mode: 'older' }), deps);
		expect(result.outcome).toBe('session-expired');
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['a']);
		expect(registry.states.get('liked')).toEqual({ oldestCursor: '1', hasMoreOlder: true });
	});

	it('reports a block deadline on rate limiting', async () => {
		const { client, deps } = setup({ liked: { tags: ['like'], pages: [[item('a')]] } });
		client.failOn = { call: 2, error: new RateLimitedError('429') };
		const result = await runSync(config(), deps);
		expect(result.outcome).toBe('rate-limited');
		expect(result.blockedUntil).toEqual(new Date('2024-06-01T06:00:00Z'));
	});

	it('honors a stop request', async () => {
		const { tracker, ingestor, deps } = setup({
			liked: { tags: ['like'], pages: [[item('a')]] }
		});
		tracker.stopAfterChecks = 0;
		const result = await runSync(config(), deps);
		expect(result.outcome).toBe('stopped');
		expect(ingestor.ingested).toEqual([]);
	});

	it('isolates an ingest failure: the next items are processed and the failed one is retried later', async () => {
		const { registry, ingestor, tracker, deps } = setup({
			liked: { tags: ['like'], pages: [[item('bad'), item('a'), item('b')]] }
		});
		ingestor.failFor.add('bad');

		const first = await runSync(config(), deps);
		expect(first).toMatchObject({ outcome: 'completed', created: 2, failed: 1 });
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['a', 'b']);
		expect(registry.itemSources.has('bad|liked')).toBe(false);
		expect(tracker.events.some((e) => e.startsWith('Échec : @u (liked)'))).toBe(true);

		ingestor.failFor.clear();
		const second = await runSync(config(), deps);
		expect(second).toMatchObject({ outcome: 'completed', created: 1, failed: 0 });
		expect(ingestor.ingested.map((i) => i.pk)).toEqual(['a', 'b', 'bad']);
		expect(registry.itemSources.has('bad|liked')).toBe(true);
	});

	it('rethrows unexpected errors', async () => {
		const { client, deps } = setup({ liked: { tags: ['like'], pages: [[item('a')]] } });
		client.failOn = { call: 2, error: new Error('boom') };
		await expect(runSync(config(), deps)).rejects.toThrow('boom');
	});
});
