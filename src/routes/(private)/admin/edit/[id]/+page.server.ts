import { checkAuth } from '#lib/auth.js';
import { handlePostForm } from '#lib/post-form.js';
import { getAllTagNames, getPost, updatePost } from '#lib/prisma.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
	const post = await getPost(Number(event.params.id));
	return { post, allTags: await getAllTagNames() };
};

export const actions: Actions = {
	default: async (event) => {
		const { title, chapo, content, createdAt, published, tags } = await handlePostForm(event);
		await updatePost(Number(event.params.id), {
			title,
			chapo,
			content,
			createdAt,
			published,
			tags
		});
	}
};
