import { checkAuth } from '#lib/auth.js';
import { handlePostForm } from '#lib/post-form.js';
import { createPost, getAllTagNames } from '#lib/prisma.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
	return { allTags: await getAllTagNames() };
};

export const actions: Actions = {
	default: async (event) => {
		const { title, chapo, content, published, createdAt, tags } = await handlePostForm(event);
		await createPost({
			title,
			chapo,
			content,
			published,
			createdAt: createdAt || new Date().toISOString(),
			tags
		});
	}
};
