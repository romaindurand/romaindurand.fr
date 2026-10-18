import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	downloadTo,
	extFromUrl,
	fileExists,
	mediaRelPath,
	mimeFromPath,
	parseRange,
	posterRelPath,
	removeMediaFiles,
	resolveMediaPath
} from './media-storage';

let dir: string;
beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'rd-media-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('paths', () => {
	it('builds year/pk/index paths', () => {
		const takenAt = new Date('2024-03-05T00:00:00Z');
		expect(mediaRelPath('123', takenAt, 0, 'jpg')).toBe('2024/123/0.jpg');
		expect(posterRelPath('123', takenAt, 2)).toBe('2024/123/2-poster.jpg');
	});
	it('derives the extension from the url, with a whitelist and a fallback', () => {
		expect(extFromUrl('https://cdn/x/a.JPG?stp=1', 'image')).toBe('jpg');
		expect(extFromUrl('https://cdn/x/a.mp4?e=1', 'video')).toBe('mp4');
		expect(extFromUrl('https://cdn/x/a.webp', 'image')).toBe('webp');
		expect(extFromUrl('https://cdn/x/a.exe', 'image')).toBe('jpg');
		expect(extFromUrl('https://cdn/x/noext', 'video')).toBe('mp4');
	});
	it('refuses paths that escape the media directory', () => {
		expect(resolveMediaPath(dir, '2024/1/0.jpg')).toBe(join(dir, '2024/1/0.jpg'));
		expect(resolveMediaPath(dir, '../etc/passwd')).toBeNull();
		expect(resolveMediaPath(dir, '/etc/passwd')).toBeNull();
		expect(resolveMediaPath(dir, '..hidden/0.jpg')).toBe(join(dir, '..hidden/0.jpg'));
	});
	it('maps extensions to mime types', () => {
		expect(mimeFromPath('a/b.jpg')).toBe('image/jpeg');
		expect(mimeFromPath('a/b.mp4')).toBe('video/mp4');
		expect(mimeFromPath('a/b.bin')).toBe('application/octet-stream');
	});
});

describe('downloadTo', () => {
	it('writes the file atomically', async () => {
		await downloadTo(dir, '2024/1/0.jpg', 'https://cdn/a.jpg', async () => new Response('hello'));
		expect(await readFile(join(dir, '2024/1/0.jpg'), 'utf8')).toBe('hello');
		expect(await readdir(join(dir, '2024/1'))).toEqual(['0.jpg']);
		expect(await fileExists(dir, '2024/1/0.jpg')).toBe(true);
	});
	it('throws and leaves nothing behind on an HTTP error', async () => {
		await expect(
			downloadTo(
				dir,
				'2024/1/0.jpg',
				'https://cdn/a.jpg',
				async () => new Response('x', { status: 403 })
			)
		).rejects.toThrow('HTTP 403');
		expect(await fileExists(dir, '2024/1/0.jpg')).toBe(false);
		expect(await readdir(join(dir, '2024/1'))).toEqual([]);
	});
});

describe('removeMediaFiles', () => {
	it('removes the files and the emptied directories, ignoring missing ones', async () => {
		await downloadTo(dir, '2024/1/0.jpg', 'u', async () => new Response('a'));
		await downloadTo(dir, '2024/1/0-poster.jpg', 'u', async () => new Response('b'));
		await removeMediaFiles(dir, ['2024/1/0.jpg', '2024/1/0-poster.jpg', '2024/1/gone.jpg']);
		expect(await readdir(dir)).toEqual(['2024']);
		expect(await readdir(join(dir, '2024'))).toEqual([]);
	});
});

describe('parseRange', () => {
	it('returns null without a header', () => {
		expect(parseRange(null, 100)).toBeNull();
	});
	it('parses closed, open-ended and suffix ranges', () => {
		expect(parseRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
		expect(parseRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
		expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
		expect(parseRange('bytes=50-500', 100)).toEqual({ start: 50, end: 99 });
	});
	it('flags unsatisfiable or malformed ranges', () => {
		expect(parseRange('bytes=100-200', 100)).toBe('invalid');
		expect(parseRange('bytes=9-2', 100)).toBe('invalid');
		expect(parseRange('items=0-1', 100)).toBe('invalid');
	});
});
