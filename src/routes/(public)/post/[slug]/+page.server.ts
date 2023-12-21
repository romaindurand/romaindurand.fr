import { getPost } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const postId = getIdFromSlug(event.params.slug);
	const post = await getPost(postId);
	if (!post) error(404, 'Post not found');
	return { post };
};

function getIdFromSlug(slug: string) {
	return Number(slug.split('-').pop());
}
