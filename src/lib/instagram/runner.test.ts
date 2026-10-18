import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { resetDb } from '../../test/db';
import { startJob } from './runner';
import { acquireRun, finishRun } from './runs';
import { getSession, saveCookies, setBlockedUntil } from './session';

const secret = 'a-long-random-secret-of-at-least-32-chars';
let dir: string;
beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'rd-runner-'));
});
afterEach(async () => {
	await rm(dir, { recursive: true, force: true });
	await resetDb();
});

const env = () => ({ mediaDir: dir, secret });
const cookies = { sessionid: 's', csrftoken: 'c', ds_user_id: '1' };

async function waitForRun(id: number) {
	for (let i = 0; i < 100; i++) {
		const run = await prisma.syncRun.findUniqueOrThrow({ where: { id } });
		if (run.status !== 'running') return run;
		await new Promise((resolve) => setTimeout(resolve, 30));
	}
	throw new Error('Le job ne se termine pas');
}

describe('startJob guards', () => {
	it('rejects with 412 without a valid session', async () => {
		await expect(startJob('sync-new', env())).rejects.toMatchObject({ status: 412 });
	});

	it('rejects with 412 during the anti-block pause', async () => {
		await saveCookies(cookies, secret);
		await setBlockedUntil(new Date(Date.now() + 3600_000));
		await expect(startJob('sync-new', env())).rejects.toMatchObject({ status: 412 });
	});

	it('rejects with 409 while another job is running', async () => {
		await saveCookies(cookies, secret);
		await acquireRun('sync-new');
		await expect(startJob('media', env())).rejects.toMatchObject({ status: 409 });
	});

	it('releases the lock for the next job once finished', async () => {
		await saveCookies(cookies, secret);
		const run = (await acquireRun('sync-new'))!;
		await finishRun(run.id, 'done', {});
		const id = await startJob('scan', env());
		await waitForRun(id);
	});
});

describe('startJob execution', () => {
	it('runs a file scan without any Instagram session', async () => {
		await prisma.post.create({
			data: {
				title: 't',
				media: { create: [{ position: 0, kind: 'image', path: 'gone.jpg', width: 1, height: 1 }] }
			}
		});
		const id = await startJob('scan', env());
		const run = await waitForRun(id);
		expect(run.status).toBe('done');
		expect(JSON.parse(run.result)).toMatchObject({ checked: 1, missing: 1 });
		expect((await prisma.postMedia.findFirstOrThrow()).status).toBe('missing');
	});

	it('marks the session expired and fails the run when the stored cookies are unreadable', async () => {
		await getSession();
		await prisma.instagramSession.update({
			where: { id: 1 },
			data: { cookies: 'garbage', status: 'ok' }
		});
		const id = await startJob('sync-new', env());
		const run = await waitForRun(id);
		expect(run.status).toBe('failed');
		expect((await getSession()).status).toBe('expired');
	});
});
