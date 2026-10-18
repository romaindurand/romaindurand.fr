import { afterEach, describe, expect, it } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { resetDb } from '../../test/db';
import {
	LOCK_STALE_MS,
	RunTracker,
	acquireRun,
	estimate,
	finishRun,
	getCurrentRun,
	requestStop
} from './runs';

afterEach(resetDb);

describe('acquireRun', () => {
	it('grants the lock once, then refuses while the run is alive', async () => {
		const first = await acquireRun('sync-new');
		expect(first?.status).toBe('running');
		expect(await acquireRun('sync-older')).toBeNull();
	});

	it('takes over a stale lock and marks the old run failed', async () => {
		const t0 = new Date('2024-06-01T00:00:00Z');
		const first = await acquireRun('sync-new', t0);
		const later = new Date(t0.getTime() + LOCK_STALE_MS + 1000);
		const second = await acquireRun('media', later);
		expect(second?.kind).toBe('media');
		const old = await prisma.syncRun.findUniqueOrThrow({ where: { id: first!.id } });
		expect(old.status).toBe('failed');
	});

	it('grants the lock again once the run is finished', async () => {
		const first = await acquireRun('scan');
		await finishRun(first!.id, 'done', { checked: 1 });
		expect(await acquireRun('scan')).not.toBeNull();
	});
});

describe('RunTracker', () => {
	it('records total, progress samples, events and the heartbeat', async () => {
		const run = (await acquireRun('sync-new'))!;
		let clock = 1_000_000;
		const tracker = new RunTracker(run.id, () => new Date(clock));
		await tracker.setTotal(10);
		for (let done = 1; done <= 3; done++) {
			clock += 60_000;
			await tracker.progress(done, `@u${done}`);
		}
		await tracker.event('Nouveau : @u3');
		const row = await prisma.syncRun.findUniqueOrThrow({ where: { id: run.id } });
		expect(row).toMatchObject({ total: 10, done: 3, current: '@u3' });
		expect(JSON.parse(row.samples)).toHaveLength(3);
		expect(JSON.parse(row.events)).toEqual([{ t: clock, message: 'Nouveau : @u3' }]);
		expect(row.heartbeatAt.getTime()).toBe(clock);
	});

	it('keeps only the last 50 events and 20 samples', async () => {
		const run = (await acquireRun('sync-new'))!;
		const tracker = new RunTracker(run.id);
		for (let i = 0; i < 55; i++) await tracker.event(`e${i}`);
		for (let i = 1; i <= 25; i++) await tracker.progress(i, 'x');
		const row = await prisma.syncRun.findUniqueOrThrow({ where: { id: run.id } });
		const events = JSON.parse(row.events);
		expect(events).toHaveLength(50);
		expect(events[0].message).toBe('e5');
		expect(JSON.parse(row.samples)).toHaveLength(20);
	});

	it('reports a stop request', async () => {
		const run = (await acquireRun('sync-new'))!;
		const tracker = new RunTracker(run.id);
		expect(await tracker.shouldStop()).toBe(false);
		expect(await requestStop()).toBe(true);
		expect(await tracker.shouldStop()).toBe(true);
	});

	it('requestStop is a no-op without a running job', async () => {
		expect(await requestStop()).toBe(false);
	});

	it('beat only refreshes the heartbeat', async () => {
		const run = (await acquireRun('sync-new'))!;
		const tracker = new RunTracker(run.id, () => new Date(5_000_000));
		await tracker.beat();
		const row = await prisma.syncRun.findUniqueOrThrow({ where: { id: run.id } });
		expect(row.heartbeatAt.getTime()).toBe(5_000_000);
		expect(row).toMatchObject({ status: 'running', done: 0, total: 0, current: '' });
	});
});

describe('run taken over as stale', () => {
	async function staleRun() {
		const t0 = new Date('2024-06-01T00:00:00Z');
		const old = (await acquireRun('sync-new', t0))!;
		await acquireRun('media', new Date(t0.getTime() + LOCK_STALE_MS + 1000));
		return old;
	}

	it('is not rewritten by finishRun or the tracker', async () => {
		const old = await staleRun();
		const tracker = new RunTracker(old.id);
		await tracker.setTotal(10);
		await tracker.progress(3, 'x');
		await tracker.event('e');
		await tracker.beat();
		await finishRun(old.id, 'done', { ok: true });
		const row = await prisma.syncRun.findUniqueOrThrow({ where: { id: old.id } });
		expect(row).toMatchObject({ status: 'failed', total: 0, done: 0, events: '[]' });
		expect(JSON.parse(row.result)).toEqual({ error: 'Interrompu (verrou périmé)' });
	});

	it('tells its tracker to stop', async () => {
		const old = await staleRun();
		expect(await new RunTracker(old.id).shouldStop()).toBe(true);
	});
});

describe('estimate', () => {
	it('computes rate and remaining time from the sample window', () => {
		expect(
			estimate(
				[
					[0, 0],
					[60_000, 6]
				],
				12,
				60_000
			)
		).toEqual({
			ratePerMin: 6,
			remainingMs: 60_000
		});
	});
	it('slows the estimate while nothing progresses (pauses included)', () => {
		expect(
			estimate(
				[
					[0, 0],
					[60_000, 6]
				],
				12,
				120_000
			)
		).toEqual({
			ratePerMin: 3,
			remainingMs: 120_000
		});
	});
	it('returns null without enough data or progress, and no remaining time without total', () => {
		expect(estimate([[0, 1]], 10, 1000)).toBeNull();
		expect(
			estimate(
				[
					[0, 3],
					[1000, 3]
				],
				10,
				2000
			)
		).toBeNull();
		expect(
			estimate(
				[
					[0, 0],
					[60_000, 6]
				],
				0,
				60_000
			)?.remainingMs
		).toBeNull();
	});
	it('reports zero remaining once the total is reached', () => {
		expect(
			estimate(
				[
					[0, 0],
					[60_000, 12]
				],
				12,
				60_000
			)?.remainingMs
		).toBe(0);
	});
});

describe('getCurrentRun', () => {
	it('returns null without any run', async () => {
		expect(await getCurrentRun()).toBeNull();
	});
	it('returns the latest run as a JSON-friendly view with its estimate while running', async () => {
		const run = (await acquireRun('media'))!;
		let clock = 0;
		const tracker = new RunTracker(run.id, () => new Date(clock));
		await tracker.setTotal(12);
		clock = 1;
		await tracker.progress(0, 'a');
		clock = 60_001;
		await tracker.progress(6, 'b');
		const view = await getCurrentRun(new Date(60_001));
		expect(view).toMatchObject({
			id: run.id,
			kind: 'media',
			status: 'running',
			total: 12,
			done: 6
		});
		expect(view?.ratePerMin).toBeCloseTo(6, 1);
		expect(view?.remainingMs).toBeGreaterThan(0);

		await finishRun(run.id, 'done', { recovered: 6 });
		const finished = await getCurrentRun();
		expect(finished).toMatchObject({ status: 'done', result: { recovered: 6 }, remainingMs: null });
		expect(typeof finished?.finishedAt).toBe('string');
	});
	it('presents a running job without heartbeat as failed, without estimate', async () => {
		const t0 = new Date('2024-06-01T00:00:00Z');
		const run = (await acquireRun('scan', t0))!;
		const tracker = new RunTracker(run.id, () => t0);
		await tracker.setTotal(10);
		await tracker.progress(1, 'a');
		const alive = await getCurrentRun(new Date(t0.getTime() + LOCK_STALE_MS - 1000));
		expect(alive?.status).toBe('running');
		const dead = await getCurrentRun(new Date(t0.getTime() + LOCK_STALE_MS + 1000));
		expect(dead).toMatchObject({
			id: run.id,
			status: 'failed',
			result: { error: 'Interrompu (aucun signe de vie)' },
			ratePerMin: null,
			remainingMs: null
		});
	});
});
