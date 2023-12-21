import { checkAuth } from '$lib/auth';
import { deletePost } from '$lib/prisma.js';
import { json } from '@sveltejs/kit';

export const DELETE = async (event) => {
	checkAuth(event);
	const deletedPost = await deletePost(Number(event.params.id));
	return json({ ok: true, deletedPost });
};
