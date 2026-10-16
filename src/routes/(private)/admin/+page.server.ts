import { checkAuth } from '#lib/auth.js';
import { getAllPosts } from '#lib/prisma.js';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	checkAuth(event);
	const posts = await getAllPosts();
	return {
		posts
	};
}) satisfies PageServerLoad;
