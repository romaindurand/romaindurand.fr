import { countPosts, getTagCounts, listPosts } from '#lib/prisma.js';
import { HOME_PAGE_SIZE, parsePage, parseTagFilter } from '#lib/tag-filter.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const filter = parseTagFilter(url.searchParams);
	const page = parsePage(url.searchParams);
	const [posts, total, tagCounts] = await Promise.all([
		listPosts({
			published: true,
			...filter,
			limit: HOME_PAGE_SIZE,
			offset: (page - 1) * HOME_PAGE_SIZE,
			onlyOkMedia: true
		}),
		countPosts({ published: true, ...filter }),
		getTagCounts(true)
	]);
	return { posts, total, tagCounts, filter, page, pageSize: HOME_PAGE_SIZE };
};
