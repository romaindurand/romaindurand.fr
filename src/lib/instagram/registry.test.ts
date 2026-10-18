import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { resetDb } from '../../test/db';
import { fileExists } from './media-storage';
import { PrismaIngestor, PrismaRegistry } from './registry';
import type { IgItem } from './types';

let dir: string;
beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'rd-ingest-'));
});
afterEach(async () => {
	await rm(dir, { recursive: true, force: true });
	await resetDb();
});

const okFetch = (async (url: URL | string) =>
	String(url).includes('fail')
		? new Response('x', { status: 500 })
		: new Response('data')) as typeof fetch;
const neverFetch = (async () => {
	throw new Error('aucun téléchargement attendu');
}) as typeof fetch;

const photo: IgItem = {
	pk: '100',
	code: 'AAA',
	url: 'https://www.instagram.com/p/AAA/',
	author: 'alice',
	caption: 'Hello <b>world</b>',
	takenAt: new Date('2023-05-04T10:00:00Z'),
	type: 'image',
	media: [{ index: 0, kind: 'image', url: 'https://cdn/a.jpg', width: 1080, height: 1350 }]
};
const reel: IgItem = {
	...photo,
	pk: '101',
	code: 'BBB',
	url: 'https://www.instagram.com/p/BBB/',
	type: 'video',
	media: [
		{
			index: 0,
			kind: 'video',
			url: 'https://cdn/b.mp4',
			posterUrl: 'https://cdn/b.jpg',
			width: 720,
			height: 1280
		}
	]
};
const album: IgItem = {
	...photo,
	pk: '102',
	code: 'CCC',
	type: 'carousel',
	media: [
		{ index: 0, kind: 'image', url: 'https://cdn/c0.jpg', width: 10, height: 10 },
		{ index: 1, kind: 'video', url: 'https://cdn/c1.mp4', width: 10, height: 10 }
	]
};

describe('PrismaIngestor', () => {
	it('creates an unpublished tagged draft for a video, with its files and a registry row', async () => {
		await new PrismaIngestor(dir, okFetch).ingest(reel, ['saved', 'La base']);

		const post = await prisma.post.findFirstOrThrow({
			include: { tags: true, media: true, instagram: true }
		});
		expect(post.published).toBe(false);
		expect(post.createdAt).toEqual(reel.takenAt);
		expect(post.content).not.toContain('<Instagram');
		expect(post.tags.map((t) => t.name).sort()).toEqual(['La base', 'saved']);
		expect(post.instagram).toMatchObject({
			pk: '101',
			author: 'alice',
			caption: 'Hello <b>world</b>',
			url: reel.url,
			type: 'video'
		});
		expect(post.media.map((m) => [m.path, m.posterPath, m.status, m.sourceIndex, m.kind])).toEqual([
			['2023/101/0.mp4', '2023/101/0-poster.jpg', 'ok', 0, 'video']
		]);
		expect(await fileExists(dir, '2023/101/0.mp4')).toBe(true);
		expect(await fileExists(dir, '2023/101/0-poster.jpg')).toBe(true);
	});

	it('downloads nothing for a photo and embeds it in the escaped content instead', async () => {
		await new PrismaIngestor(dir, neverFetch).ingest(photo, ['like']);
		const post = await prisma.post.findFirstOrThrow({ include: { media: true } });
		expect(post.media).toEqual([]);
		expect(post.title).toBe('Hello <b>world</b>');
		expect(post.content).toContain('&lt;b&gt;world&lt;/b&gt;');
		expect(post.content).toContain('<Instagram code="AAA" />');
		expect(await readdir(dir)).toEqual([]);
	});

	it('treats a carousel like a photo, even when it contains a video', async () => {
		await new PrismaIngestor(dir, neverFetch).ingest(album, ['saved']);
		const post = await prisma.post.findFirstOrThrow({ include: { media: true } });
		expect(post.media).toEqual([]);
		expect(post.content).toContain('<Instagram code="CCC" />');
	});

	it('still creates the draft when the video download fails, with the media marked missing', async () => {
		const failing = {
			...reel,
			pk: '103',
			media: [{ ...reel.media[0], url: 'https://cdn/fail.mp4' }]
		};
		await new PrismaIngestor(dir, okFetch).ingest(failing, ['like']);
		expect((await prisma.postMedia.findFirstOrThrow()).status).toBe('missing');
		expect(await prisma.post.count()).toBe(1);
	});

	it('marks the video missing when only its poster fails', async () => {
		const failing = {
			...reel,
			pk: '104',
			media: [{ ...reel.media[0], posterUrl: 'https://cdn/fail.jpg' }]
		};
		await new PrismaIngestor(dir, okFetch).ingest(failing, ['like']);
		expect((await prisma.postMedia.findFirstOrThrow()).status).toBe('missing');
	});
});

describe('PrismaRegistry', () => {
	it('stores and reads source states', async () => {
		const registry = new PrismaRegistry();
		expect(await registry.getSourceState('liked')).toBeNull();
		await registry.saveSourceState('liked', { oldestCursor: 'abc', hasMoreOlder: true });
		expect(await registry.getSourceState('liked')).toEqual({
			oldestCursor: 'abc',
			hasMoreOlder: true
		});
		await registry.saveSourceState('liked', { oldestCursor: null, hasMoreOlder: false });
		expect(await registry.getSourceState('liked')).toEqual({
			oldestCursor: null,
			hasMoreOlder: false
		});
	});

	it('tracks items and their sources idempotently', async () => {
		await new PrismaIngestor(dir, okFetch).ingest(photo, ['like']);
		const registry = new PrismaRegistry();
		expect(await registry.hasItem('100')).toBe(true);
		expect(await registry.hasItem('999')).toBe(false);
		expect(await registry.hasItemSource('100', 'liked')).toBe(false);
		await registry.addItemSource('100', 'liked');
		await registry.addItemSource('100', 'liked');
		expect(await registry.hasItemSource('100', 'liked')).toBe(true);
		expect(await prisma.instagramItemSource.count()).toBe(1);
	});

	it('adds tags to the existing post only', async () => {
		await new PrismaIngestor(dir, okFetch).ingest(photo, ['like']);
		const registry = new PrismaRegistry();
		await registry.addTagsToPost('100', ['saved']);
		const post = await prisma.post.findFirstOrThrow({ include: { tags: true } });
		expect(post.tags.map((t) => t.name).sort()).toEqual(['like', 'saved']);

		await prisma.post.delete({ where: { id: post.id } });
		await registry.addTagsToPost('100', ['repost']);
		expect(await prisma.post.count()).toBe(0);
		expect(await registry.hasItem('100')).toBe(true);
	});
});
