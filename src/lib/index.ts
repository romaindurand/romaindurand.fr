import type { Post } from '../../generated/prisma/client';

/**
 * Builds the URL slug of a post: `<title>-<id>`, lowercased, accents stripped, non-alphanumerics replaced by `-`.
 * Only `id` and `title` are needed, so neighbor posts loaded without `content` are accepted.
 */
export function getSlug(post: Pick<Post, 'id' | 'title'>) {
	const slug = `${post.title}-${post.id}`
		.replace(/\s+/g, '-')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, '-');
	return slug;
}

export function targetBlankLinks() {
	if (typeof document === 'undefined') return;
	document.querySelectorAll('.PostBody a').forEach((link) => {
		link.setAttribute('target', '_blank');
		link.setAttribute('rel', 'noopener');
	});
}
