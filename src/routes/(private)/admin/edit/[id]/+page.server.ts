import { checkAuth } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';
import { PrismaClient } from '@prisma/client';
import { error } from '@sveltejs/kit';

const prisma = new PrismaClient();

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
	const post = await prisma.post.findUnique({
		where: { id: Number(event.params.id) }
	});
	return { post };
};

export const actions: Actions = {
	default: async (event) => {
		checkAuth(event);
		event.cookies.get('session');
		const data = await event.request.formData();
		const content = data.get('content')?.toString();
		const title = data.get('title')?.toString();
		const chapo = data.get('chapo')?.toString();

		if (!title) {
			return error(400, 'title is required');
		}

		await prisma.post.update({
			data: { content, title, chapo },
			where: { id: Number(event.params.id) }
		});
	}
};
