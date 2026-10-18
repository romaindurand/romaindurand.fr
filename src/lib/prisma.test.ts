import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	countPosts,
	createPost,
	getAllTagNames,
	getPost,
	getTagCounts,
	listPosts,
	prisma,
	updatePost
} from '#lib/prisma.js';
import { resetDb } from '../test/db';

afterEach(resetDb);

const tags = (...names: string[]) => ({
	connectOrCreate: names.map((name) => ({ where: { name }, create: { name } }))
});

async function seed() {
	const day = (d: number) => new Date(`2024-01-0${d}T10:00:00Z`);
	const post = (title: string, published: boolean, d: number, ...names: string[]) =>
		prisma.post.create({
			data: {
				title,
				published,
				createdAt: day(d),
				...(names.length ? { tags: tags(...names) } : {})
			}
		});
	await post('A', true, 1, 'like', 'repost');
	await post('B', true, 2, 'like');
	await post('C', false, 3, 'saved', 'like');
	await post('D', true, 4);
}

const titles = (posts: { title: string }[]) => posts.map((p) => p.title);

describe('listPosts / countPosts', () => {
	beforeEach(seed);

	it('lists published posts newest first, without content', async () => {
		const posts = await listPosts({ published: true });
		expect(titles(posts)).toEqual(['D', 'B', 'A']);
		expect(posts[0]).not.toHaveProperty('content');
		expect(posts[2].tags.map((t) => t.name)).toEqual(['like', 'repost']);
	});

	it('mode any returns posts having at least one tag', async () => {
		const posts = await listPosts({ published: true, tags: ['like', 'repost'], mode: 'any' });
		expect(titles(posts)).toEqual(['B', 'A']);
	});

	it('mode all returns posts having every tag', async () => {
		const posts = await listPosts({ published: true, tags: ['like', 'repost'], mode: 'all' });
		expect(titles(posts)).toEqual(['A']);
	});

	it('includes drafts when published is undefined and filters drafts only', async () => {
		expect(titles(await listPosts({ tags: ['like'], mode: 'any' }))).toEqual(['C', 'B', 'A']);
		expect(titles(await listPosts({ published: false, tags: ['saved'] }))).toEqual(['C']);
	});

	it('counts like listPosts', async () => {
		expect(await countPosts({ published: true })).toBe(3);
		expect(await countPosts({ published: true, tags: ['like', 'repost'], mode: 'all' })).toBe(1);
		expect(await countPosts({ tags: ['like', 'repost'], mode: 'any' })).toBe(3);
	});

	it('paginates with limit and offset', async () => {
		expect(titles(await listPosts({ published: true, limit: 2, offset: 1 }))).toEqual(['B', 'A']);
	});

	it('orders by id when asked', async () => {
		expect(titles(await listPosts({ orderBy: 'id' }))).toEqual(['D', 'C', 'B', 'A']);
	});

	it('can restrict media to the ok ones', async () => {
		const post = await prisma.post.findFirstOrThrow({ where: { title: 'A' } });
		await prisma.postMedia.createMany({
			data: [
				{
					postId: post.id,
					position: 0,
					kind: 'image',
					path: 'a.jpg',
					width: 1,
					height: 1,
					status: 'ok'
				},
				{
					postId: post.id,
					position: 1,
					kind: 'image',
					path: 'b.jpg',
					width: 1,
					height: 1,
					status: 'missing'
				}
			]
		});
		const all = await listPosts({ published: true });
		expect(all.find((p) => p.title === 'A')?.media).toHaveLength(2);
		const ok = await listPosts({ published: true, onlyOkMedia: true });
		expect(ok.find((p) => p.title === 'A')?.media.map((m) => m.path)).toEqual(['a.jpg']);
	});
});

describe('getTagCounts / getAllTagNames', () => {
	beforeEach(seed);

	it('counts published posts only and hides empty tags', async () => {
		expect(await getTagCounts(true)).toEqual([
			{ name: 'like', count: 2 },
			{ name: 'repost', count: 1 }
		]);
	});

	it('counts every post when published is undefined', async () => {
		expect(await getTagCounts()).toEqual([
			{ name: 'like', count: 3 },
			{ name: 'repost', count: 1 },
			{ name: 'saved', count: 1 }
		]);
	});

	it('lists tag names alphabetically', async () => {
		expect(await getAllTagNames()).toEqual(['like', 'repost', 'saved']);
	});
});

describe('createPost / updatePost with tags', () => {
	it('creates a post with tags and replaces them on update', async () => {
		const created = await createPost({
			title: 't',
			chapo: '',
			content: '',
			published: false,
			createdAt: new Date().toISOString(),
			tags: ['a', 'b']
		});
		expect((await getPost(created.id))?.tags.map((t) => t.name)).toEqual(['a', 'b']);

		await updatePost(created.id, {
			title: 't2',
			chapo: '',
			content: '',
			published: true,
			createdAt: new Date().toISOString(),
			tags: ['b', 'c']
		});
		const updated = await getPost(created.id);
		expect(updated?.title).toBe('t2');
		expect(updated?.tags.map((t) => t.name)).toEqual(['b', 'c']);
	});

	it('leaves tags untouched when tags is omitted on update', async () => {
		const created = await createPost({
			title: 't',
			chapo: '',
			content: '',
			published: false,
			createdAt: new Date().toISOString(),
			tags: ['a']
		});
		await updatePost(created.id, {
			title: 'x',
			chapo: '',
			content: '',
			published: false,
			createdAt: new Date().toISOString()
		});
		expect((await getPost(created.id))?.tags.map((t) => t.name)).toEqual(['a']);
	});
});
