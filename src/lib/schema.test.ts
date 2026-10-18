import { afterEach, describe, expect, it } from 'vitest';
import { prisma } from '#lib/prisma.js';
import { resetDb } from '../test/db';

afterEach(resetDb);

describe('schema', () => {
	it('cascades PostMedia and keeps the registry row when a post is deleted', async () => {
		const post = await prisma.post.create({
			data: {
				title: 't',
				tags: { create: [{ name: 'like' }] },
				media: {
					create: [{ position: 0, kind: 'image', path: '2024/1/0.jpg', width: 10, height: 10 }]
				},
				instagram: {
					create: { pk: '1', code: 'c', url: 'u', author: 'a', type: 'image', takenAt: new Date() }
				}
			}
		});
		await prisma.post.delete({ where: { id: post.id } });
		expect(await prisma.postMedia.count()).toBe(0);
		const item = await prisma.instagramItem.findUniqueOrThrow({ where: { pk: '1' } });
		expect(item.postId).toBeNull();
		expect(await prisma.tag.count()).toBe(1);
	});

	it('cascades item sources when a registry row is deleted', async () => {
		await prisma.instagramItem.create({
			data: {
				pk: '2',
				code: 'c',
				url: 'u',
				author: 'a',
				type: 'image',
				takenAt: new Date(),
				sources: { create: [{ source: 'liked' }, { source: 'saved' }] }
			}
		});
		await prisma.instagramItem.delete({ where: { pk: '2' } });
		expect(await prisma.instagramItemSource.count()).toBe(0);
	});
});
