import type { Post } from '@prisma/client';

export function getSlug(post: Post) {
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
