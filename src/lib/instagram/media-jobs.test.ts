import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { resetDb } from '../../test/db';
import { runRecovery, runScan, type RecoveryConfig, type RecoveryDeps } from './media-jobs';
import { fileExists } from './media-storage';
import type { Tracker } from './sync';
import { RateLimitedError, SessionExpiredError, type IgItem, type InstagramClient } from './types';

let dir: string;
beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'rd-jobs-'));
});
afterEach(async () => {
	await rm(dir, { recursive: true, force: true });
	await resetDb();
});

const tracker: Tracker = {
	setTotal: async () => {},
	progress: async () => {},
	event: async () => {},
	shouldStop: async () => false
};

const okFetch = (async () => new Response('data')) as typeof fetch;

const fresh = (pk: string, indexes = [0]): IgItem => ({
	pk,
	code: pk,
	url: `https://x/${pk}`,
	author: 'u',
	caption: '',
	takenAt: new Date('2024-01-01'),
	type: 'image',
	media: indexes.map((index) => ({
		index,
		kind: 'image' as const,
		url: `https://cdn/${pk}-${index}.jpg`,
		width: 10,
		height: 10
	}))
});

const clientFor = (items: Record<string, IgItem | Error | null>): InstagramClient => ({
	listSources: async () => [],
	fetchPage: async () => ({ items: [], nextCursor: null }),
	fetchItem: async (pk) => {
		const value = items[pk] ?? null;
		if (value instanceof Error) throw value;
		return value;
	}
});

const config = (over: Partial<RecoveryConfig> = {}): RecoveryConfig => ({
	limit: 25,
	minDelayMs: 0,
	maxDelayMs: 0,
	maxRequests: 60,
	pauseMs: 6 * 3600_000,
	...over
});
const deps = (client: InstagramClient, over: Partial<RecoveryDeps> = {}): RecoveryDeps => ({
	client,
	mediaDir: dir,
	tracker,
	sleep: async () => {},
	random: () => 0,
	now: () => new Date('2024-06-01T00:00:00Z'),
	fetchFn: okFetch,
	...over
});

async function makePost(opts: { pk?: string; status?: string; paths?: string[] } = {}) {
	const { pk, status = 'missing', paths = ['2024/9/0.jpg'] } = opts;
	return prisma.post.create({
		data: {
			title: 't',
			media: {
				create: paths.map((path, index) => ({
					position: index,
					sourceIndex: index,
					kind: 'image',
					path,
					width: 10,
					height: 10,
					status
				}))
			},
			...(pk
				? {
						instagram: {
							create: { pk, code: pk, url: 'u', author: 'a', type: 'image', takenAt: new Date() }
						}
					}
				: {})
		},
		include: { media: true }
	});
}

async function putFile(rel: string) {
	await mkdir(dirname(join(dir, rel)), { recursive: true });
	await writeFile(join(dir, rel), 'x');
}

describe('runScan', () => {
	it('flips ok to missing, missing to ok, and keeps unavailable when the file is absent', async () => {
		await putFile('present.jpg');
		const ok = await makePost({ status: 'ok', paths: ['gone.jpg'] });
		const missing = await makePost({ status: 'missing', paths: ['present.jpg'] });
		const unavailable = await makePost({ status: 'unavailable', paths: ['absent.jpg'] });

		const result = await runScan({ mediaDir: dir, tracker });
		expect(result).toEqual({ checked: 3, missing: 1, restored: 1 });
		const status = async (id: number) =>
			(await prisma.postMedia.findFirstOrThrow({ where: { postId: id } })).status;
		expect(await status(ok.id)).toBe('missing');
		expect(await status(missing.id)).toBe('ok');
		expect(await status(unavailable.id)).toBe('unavailable');
	});

	it('treats a missing poster as a missing media', async () => {
		await putFile('v.mp4');
		const post = await makePost({ status: 'ok', paths: ['v.mp4'] });
		await prisma.postMedia.updateMany({
			where: { postId: post.id },
			data: { posterPath: 'v.jpg' }
		});
		await runScan({ mediaDir: dir, tracker });
		expect((await prisma.postMedia.findFirstOrThrow({ where: { postId: post.id } })).status).toBe(
			'missing'
		);
	});
});

describe('runRecovery', () => {
	it('re-downloads missing media from fresh urls and marks them ok', async () => {
		const post = await makePost({ pk: '9', paths: ['2024/9/0.jpg', '2024/9/1.jpg'] });
		const result = await runRecovery(config(), deps(clientFor({ '9': fresh('9', [0, 1]) })));
		expect(result).toMatchObject({ outcome: 'completed', posts: 1, recovered: 2, requests: 1 });
		expect(await fileExists(dir, '2024/9/0.jpg')).toBe(true);
		expect(await fileExists(dir, '2024/9/1.jpg')).toBe(true);
		const rows = await prisma.postMedia.findMany({ where: { postId: post.id } });
		expect(rows.every((row) => row.status === 'ok')).toBe(true);
	});

	it('marks media unavailable when the publication is gone', async () => {
		const post = await makePost({ pk: '9' });
		const result = await runRecovery(config(), deps(clientFor({ '9': null })));
		expect(result.unavailable).toBe(1);
		const row = await prisma.postMedia.findFirstOrThrow({ where: { postId: post.id } });
		expect(row).toMatchObject({
			status: 'unavailable',
			unavailableReason: 'publication supprimée ou privée'
		});
	});

	it('marks media of a hand-written post unavailable (no source)', async () => {
		const post = await makePost();
		await runRecovery(config(), deps(clientFor({})));
		const row = await prisma.postMedia.findFirstOrThrow({ where: { postId: post.id } });
		expect(row).toMatchObject({ status: 'unavailable', unavailableReason: 'sans source' });
	});

	it('marks a media absent from the fresh publication unavailable', async () => {
		const post = await makePost({ pk: '9', paths: ['2024/9/0.jpg', '2024/9/5.jpg'] });
		await prisma.postMedia.updateMany({
			where: { postId: post.id, path: '2024/9/5.jpg' },
			data: { sourceIndex: 5 }
		});
		const result = await runRecovery(config(), deps(clientFor({ '9': fresh('9', [0]) })));
		expect(result).toMatchObject({ recovered: 1, unavailable: 1 });
	});

	it('ignores unavailable media in a batch but retries them for one post', async () => {
		const post = await makePost({ pk: '9', status: 'unavailable' });
		const client = clientFor({ '9': fresh('9') });
		expect((await runRecovery(config(), deps(client))).posts).toBe(0);
		const retry = await runRecovery(config({ postId: post.id }), deps(client));
		expect(retry.recovered).toBe(1);
		expect((await prisma.postMedia.findFirstOrThrow({ where: { postId: post.id } })).status).toBe(
			'ok'
		);
	});

	it('keeps the media missing and counts a failure when the download fails', async () => {
		const post = await makePost({ pk: '9' });
		const failing = (async () => new Response('x', { status: 500 })) as typeof fetch;
		const result = await runRecovery(
			config(),
			deps(clientFor({ '9': fresh('9') }), { fetchFn: failing })
		);
		expect(result).toMatchObject({ failed: 1, recovered: 0 });
		expect((await prisma.postMedia.findFirstOrThrow({ where: { postId: post.id } })).status).toBe(
			'missing'
		);
	});

	it('limits the batch to `limit` posts', async () => {
		await makePost({ pk: '1', paths: ['2024/1/0.jpg'] });
		await makePost({ pk: '2', paths: ['2024/2/0.jpg'] });
		const result = await runRecovery(
			config({ limit: 1 }),
			deps(clientFor({ '1': fresh('1'), '2': fresh('2') }))
		);
		expect(result.posts).toBe(1);
	});

	it('reports an expired session and rate limiting', async () => {
		await makePost({ pk: '9' });
		const expired = await runRecovery(
			config(),
			deps(clientFor({ '9': new SessionExpiredError('x') }))
		);
		expect(expired.outcome).toBe('session-expired');
		const limited = await runRecovery(
			config(),
			deps(clientFor({ '9': new RateLimitedError('x') }))
		);
		expect(limited.outcome).toBe('rate-limited');
		expect(limited.blockedUntil).toEqual(new Date('2024-06-01T06:00:00Z'));
	});
});
