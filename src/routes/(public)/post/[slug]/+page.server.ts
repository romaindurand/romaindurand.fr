import { getPost } from '$lib/prisma';
import { error } from '@sveltejs/kit';

export async function load(event) {
	const postId = getIdFromSlug(event.params.slug);
	if (Number.isNaN(postId)) error(404, 'Post not found');
	const post = await getPost(postId);
	if (!post) error(404, 'Post not found');
	const { content, ...postWithoutMarkdown } = post;
	const response = await event.fetch('/render', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-render-auth': process.env.LOGIN_KEY!
		},
		body: JSON.stringify({ markdown: content })
	});
	const data = await response.json();
	const html = data.html;

	return {
		post: { ...postWithoutMarkdown, html }
	};
}

export type RenderedPost = Awaited<ReturnType<typeof load>>;

function getIdFromSlug(slug: string) {
	return Number(slug.split('-').pop());
}

export type Post = Awaited<ReturnType<typeof load>>['post'];
