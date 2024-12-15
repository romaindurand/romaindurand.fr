import { checkAuth } from '$lib/auth';
import { handlePostForm } from '$lib/post-form';
import { getPost, updatePost } from '$lib/prisma';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
	const post = await getPost(Number(event.params.id));
	return { post };
};

export const actions: Actions = {
	default: async (event) => {
		const { title, chapo, content } = await handlePostForm(event);
		await updatePost(Number(event.params.id), title, chapo, content);
	}
};
