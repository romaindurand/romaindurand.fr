import { checkAuth } from '$lib/auth';
import { getPosts } from '$lib/prisma';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	checkAuth(event);
	const posts = await getPosts();
	return {
		posts
	};
}) satisfies PageServerLoad;
