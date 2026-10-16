import { getPosts } from '#lib/prisma.js';

export async function load() {
	const posts = await getPosts();
	return {
		posts
	};
}
