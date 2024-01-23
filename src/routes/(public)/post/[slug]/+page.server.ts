import type { PageServerLoad } from './$types';

import { getPost } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import { converter } from '$lib/showdown';

export const load: PageServerLoad = async (event) => {
	const postId = getIdFromSlug(event.params.slug);
	const post = await getPost(postId);
	if (!post) error(404, 'Post not found');
	const { content, ...postWithoutMarkdown } = post;
	const html = converter.makeHtml(content);

	return {
		post: { ...postWithoutMarkdown, html }
	};
};

function getIdFromSlug(slug: string) {
	return Number(slug.split('-').pop());
}
