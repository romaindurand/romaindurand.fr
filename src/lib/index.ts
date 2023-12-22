// place files you want to import through the `$lib` alias in this folder.

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
