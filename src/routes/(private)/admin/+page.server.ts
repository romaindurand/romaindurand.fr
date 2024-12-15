import { checkAuth } from '$lib/auth';
import { getAllPosts } from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	checkAuth(event);
	const posts = await getAllPosts();
	return {
		posts
	};
}) satisfies PageServerLoad;
