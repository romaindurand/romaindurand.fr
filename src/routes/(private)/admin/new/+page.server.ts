import { checkAuth } from '$lib/auth';
import { createPost } from '$lib/prisma';
import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
};

export const actions: Actions = {
	default: async (event) => {
		checkAuth(event);
		event.cookies.get('session');
		const data = await event.request.formData();
		const content = data.get('content')?.toString() || '';
		const title = data.get('title')?.toString() || '';
		const chapo = data.get('chapo')?.toString() || '';

		if (!title) {
			return error(400, 'title is required');
		}

		await createPost(title, chapo, content);
	}
};
