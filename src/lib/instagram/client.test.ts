import { describe, expect, it } from 'vitest';
import { HttpInstagramClient, mapMedia } from './client';
import { DEFAULT_SETTINGS } from './session';
import { InstagramHttpError, RateLimitedError, SessionExpiredError } from './types';

const photo = {
	pk: '111_222',
	code: 'AAA',
	taken_at: 1700000000,
	caption: { text: 'Hello' },
	user: { username: 'alice' },
	media_type: 1,
	original_width: 1080,
	original_height: 1350,
	image_versions2: { candidates: [{ url: 'https://cdn/x/a.jpg?e=1', width: 1080, height: 1350 }] }
};
const reel = {
	pk: '333',
	code: 'BBB',
	taken_at: 1700000100,
	caption: null,
	user: { username: 'bob' },
	media_type: 2,
	original_width: 720,
	original_height: 1280,
	image_versions2: { candidates: [{ url: 'https://cdn/x/b.jpg', width: 720, height: 1280 }] },
	video_versions: [{ url: 'https://cdn/x/b.mp4?e=1', width: 720, height: 1280 }]
};
const album = {
	pk: '444',
	code: 'CCC',
	taken_at: 1700000200,
	caption: { text: 'Album' },
	user: { username: 'carol' },
	media_type: 8,
	carousel_media: [photo, reel]
};

type Route = { status?: number; body?: unknown; type?: string; headers?: Record<string, string> };
function fakeFetch(routes: Record<string, Route>) {
	const calls: { url: URL; headers: Headers }[] = [];
	const fn = (async (input: URL | string, init?: RequestInit) => {
		const url = new URL(String(input));
		calls.push({ url, headers: new Headers(init?.headers) });
		const route = routes[url.pathname];
		if (!route) {
			return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
		}
		const body = typeof route.body === 'string' ? route.body : JSON.stringify(route.body ?? {});
		return new Response(route.status === 302 ? null : body, {
			status: route.status ?? 200,
			headers: { 'content-type': route.type ?? 'application/json', ...route.headers }
		});
	}) as typeof fetch;
	return { fn, calls };
}

const cookies = { sessionid: 's', csrftoken: 'tok', ds_user_id: '1' };
const client = (routes: Record<string, Route>) => {
	const { fn, calls } = fakeFetch(routes);
	return {
		calls,
		client: new HttpInstagramClient(cookies, { settings: DEFAULT_SETTINGS, fetchFn: fn })
	};
};

describe('mapMedia', () => {
	it('maps a photo', () => {
		expect(mapMedia(photo)).toEqual({
			pk: '111',
			code: 'AAA',
			url: 'https://www.instagram.com/p/AAA/',
			author: 'alice',
			caption: 'Hello',
			takenAt: new Date(1700000000 * 1000),
			type: 'image',
			media: [
				{ index: 0, kind: 'image', url: 'https://cdn/x/a.jpg?e=1', width: 1080, height: 1350 }
			]
		});
	});
	it('maps a reel with its poster and an empty caption', () => {
		const item = mapMedia(reel);
		expect(item?.type).toBe('video');
		expect(item?.caption).toBe('');
		expect(item?.media).toEqual([
			{
				index: 0,
				kind: 'video',
				url: 'https://cdn/x/b.mp4?e=1',
				posterUrl: 'https://cdn/x/b.jpg',
				width: 720,
				height: 1280
			}
		]);
	});
	it('maps a carousel keeping the source index of each node', () => {
		const item = mapMedia(album);
		expect(item?.type).toBe('carousel');
		expect(item?.media.map((m) => [m.index, m.kind])).toEqual([
			[0, 'image'],
			[1, 'video']
		]);
	});
	it('drops items without usable media or code', () => {
		expect(mapMedia({ ...photo, image_versions2: { candidates: [] } })).toBeNull();
		expect(mapMedia({ ...photo, code: undefined })).toBeNull();
		expect(mapMedia({ ...photo, code: 'a"><b' })).toBeNull();
		expect(mapMedia({ ...photo, pk: undefined })).toBeNull();
	});
});

describe('HttpInstagramClient', () => {
	it('fetches the liked feed with session headers and a cursor', async () => {
		const { client: c, calls } = client({
			'/api/v1/feed/liked/': { body: { items: [photo], more_available: true, next_max_id: 'N2' } }
		});
		const page = await c.fetchPage('liked', 'N1');
		expect(page.items.map((i) => i.pk)).toEqual(['111']);
		expect(page.nextCursor).toBe('N2');
		expect(calls[0].url.searchParams.get('max_id')).toBe('N1');
		expect(calls[0].headers.get('x-csrftoken')).toBe('tok');
		expect(calls[0].headers.get('x-ig-app-id')).toBe('936619743392459');
		expect(calls[0].headers.get('cookie')).toContain('sessionid=s');
	});
	it('ends the feed when no more is available', async () => {
		const { client: c } = client({
			'/api/v1/feed/liked/': { body: { items: [photo], more_available: false, next_max_id: 'X' } }
		});
		expect((await c.fetchPage('liked', null)).nextCursor).toBeNull();
	});
	it('unwraps saved items', async () => {
		const { client: c } = client({
			'/api/v1/feed/saved/posts/': { body: { items: [{ media: photo }, { media: reel }] } }
		});
		expect((await c.fetchPage('saved', null)).items.map((i) => i.pk)).toEqual(['111', '333']);
	});
	it('lists liked, saved and one source per collection', async () => {
		const { client: c } = client({
			'/api/v1/collections/list/': {
				body: {
					items: [
						{ collection_id: '9', collection_name: 'La base', collection_type: 'MEDIA' },
						{
							collection_id: 'all',
							collection_name: 'Tous',
							collection_type: 'ALL_MEDIA_AUTO_COLLECTION'
						}
					],
					more_available: false
				}
			},
			'/api/v1/feed/collection/9/posts/': { body: { items: [{ media: photo }] } }
		});
		const sources = await c.listSources();
		expect(sources).toEqual([
			{ key: 'liked', tags: ['like'] },
			{ key: 'saved', tags: ['saved'] },
			{ key: 'saved:La base', tags: ['saved', 'La base'] }
		]);
		expect((await c.fetchPage('saved:La base', null)).items).toHaveLength(1);
	});
	it('rejects an unknown source', async () => {
		const { client: c } = client({});
		await expect(c.fetchPage('nope', null)).rejects.toThrow('Source inconnue');
	});
	it('fetches one item, or null when missing', async () => {
		const { client: c } = client({ '/api/v1/media/111/info/': { body: { items: [photo] } } });
		expect((await c.fetchItem('111'))?.code).toBe('AAA');
		expect(await c.fetchItem('999')).toBeNull();
		const { client: empty } = client({ '/api/v1/media/5/info/': { body: { items: [] } } });
		expect(await empty.fetchItem('5')).toBeNull();
	});
});

describe('error mapping', () => {
	const failing = (route: Route) => client({ '/api/v1/feed/liked/': route }).client;
	it('flags an expired session', async () => {
		await expect(failing({ status: 401 }).fetchPage('liked', null)).rejects.toBeInstanceOf(
			SessionExpiredError
		);
		await expect(
			failing({ status: 403, body: { message: 'login_required' } }).fetchPage('liked', null)
		).rejects.toBeInstanceOf(SessionExpiredError);
		await expect(
			failing({ status: 400, body: { message: 'checkpoint_required' } }).fetchPage('liked', null)
		).rejects.toBeInstanceOf(SessionExpiredError);
		await expect(
			failing({ body: '<html>login</html>', type: 'text/html' }).fetchPage('liked', null)
		).rejects.toBeInstanceOf(SessionExpiredError);
		await expect(
			failing({ status: 302, headers: { location: '/accounts/login/' } }).fetchPage('liked', null)
		).rejects.toBeInstanceOf(SessionExpiredError);
	});
	it('flags rate limiting', async () => {
		await expect(failing({ status: 429 }).fetchPage('liked', null)).rejects.toBeInstanceOf(
			RateLimitedError
		);
		await expect(
			failing({ status: 400, body: { message: 'feedback_required' } }).fetchPage('liked', null)
		).rejects.toBeInstanceOf(RateLimitedError);
	});
	it('does not flag the session on a server error page or invalid JSON', async () => {
		await expect(
			failing({ status: 503, body: '<html>down</html>', type: 'text/html' }).fetchPage(
				'liked',
				null
			)
		).rejects.toBeInstanceOf(InstagramHttpError);
		await expect(failing({ body: '{oops' }).fetchPage('liked', null)).rejects.toBeInstanceOf(
			InstagramHttpError
		);
	});
	it('wraps other HTTP errors', async () => {
		await expect(
			failing({ status: 500, body: {} }).fetchPage('liked', null)
		).rejects.toBeInstanceOf(InstagramHttpError);
	});
});
