import { checkAuth } from '#lib/auth.js';
import { countPosts, getTagCounts, listPosts } from '#lib/prisma.js';
import { ADMIN_PAGE_SIZE, parsePage, parseStatus, parseTagFilter } from '#lib/tag-filter.js';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	checkAuth(event);
	const filter = parseTagFilter(event.url.searchParams);
	const status = parseStatus(event.url.searchParams);
	const page = parsePage(event.url.searchParams);
	const published = status === 'all' ? undefined : status === 'published';
	const [posts, total, tagCounts] = await Promise.all([
		listPosts({
			published,
			...filter,
			limit: ADMIN_PAGE_SIZE,
			offset: (page - 1) * ADMIN_PAGE_SIZE,
			orderBy: 'id'
		}),
		countPosts({ published, ...filter }),
		getTagCounts()
	]);
	return { posts, total, tagCounts, filter, status, page, pageSize: ADMIN_PAGE_SIZE };
}) satisfies PageServerLoad;
