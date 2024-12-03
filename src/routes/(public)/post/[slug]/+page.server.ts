import type { PageServerLoad } from './$types';

import { getPost } from '$lib/prisma';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const postId = getIdFromSlug(event.params.slug);
	if (Number.isNaN(postId)) error(404, 'Post not found');
	const post = await getPost(postId);
	if (!post) error(404, 'Post not found');
	const { content, ...postWithoutMarkdown } = post;
	const response = await event.fetch('/render', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ markdown: content })
	});
	const data = await response.json();
	const html = data.html;

	return {
		post: { ...postWithoutMarkdown, html }
	};
};

function getIdFromSlug(slug: string) {
	return Number(slug.split('-').pop());
}
