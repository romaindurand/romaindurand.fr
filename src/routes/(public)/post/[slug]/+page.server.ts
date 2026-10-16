import { getPost, getPosts } from '#lib/prisma.js';
import { getNeighbors } from '#lib/posts.js';
import { error } from '@sveltejs/kit';
import { LOGIN_KEY } from '$app/env/private';

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
			'X-render-auth': LOGIN_KEY
		},
		body: JSON.stringify({ markdown: content })
	});
	const data = await response.json();
	const html = data.html;

	const { newer, older } = getNeighbors(await getPosts(), post.id);
	const strip = <T extends { content: string }>(p: T | null) => {
		if (!p) return null;
		const { content: _content, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
		return rest;
	};

	return {
		post: { ...postWithoutMarkdown, html },
		newer: strip(newer),
		older: strip(older)
	};
}

export type RenderedPost = Awaited<ReturnType<typeof load>>;

function getIdFromSlug(slug: string) {
	return Number(slug.split('-').pop());
}

export type Post = Awaited<ReturnType<typeof load>>['post'];
