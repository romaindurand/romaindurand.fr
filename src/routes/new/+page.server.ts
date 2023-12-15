import type { Actions, PageServerLoad } from './$types';
import { PrismaClient } from '@prisma/client';
import { error } from '@sveltejs/kit';

const prisma = new PrismaClient();

export const load: PageServerLoad = async (event) => {
	if (!event.locals.authenticated) {
		throw error(401, 'not logged in');
	}
};

export const actions: Actions = {
	default: async (event) => {
		event.cookies.get('session');
		const data = await event.request.formData();
		const content = data.get('content')?.toString();
		const title = data.get('title')?.toString();

		if (!title) {
			throw error(400, 'title is required');
		}

		await prisma.post.create({
			data: { content, title }
		});
	}
};
