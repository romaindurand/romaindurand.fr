import { checkAuth } from '$lib/auth';
import { handlePostForm } from '$lib/post-form';
import { createPost } from '$lib/prisma';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
};

export const actions: Actions = {
	default: async (event) => {
		const { title, chapo, content, published, createdAt } = await handlePostForm(event);
		await createPost({
			title,
			chapo,
			content,
			published,
			createdAt: createdAt || new Date().toISOString()
		});
	}
};
