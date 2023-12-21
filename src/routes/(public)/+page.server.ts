import { getPosts } from '$lib/prisma';

export async function load() {
	const posts = await getPosts();
	return {
		posts
	};
}
