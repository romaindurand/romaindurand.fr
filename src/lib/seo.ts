import type { RenderedPost } from '../routes/(public)/post/[slug]/+page.server';

export function getMetaDescription(post: RenderedPost['post']) {
	let description = `${post.chapo}\n`;
	// add html content to description
	description += post.html.replace(/<[^>]*>/g, '');

	description = description.substring(0, 150) + '...';
	return description;
}
