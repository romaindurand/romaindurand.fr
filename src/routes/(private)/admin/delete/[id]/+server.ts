import { checkAuth } from '#lib/auth.js';
import { deletePost } from '#lib/prisma.js';

export const DELETE = async (event) => {
	checkAuth(event);
	const deletedPost = await deletePost(Number(event.params.id));
	return Response.json({ ok: true, deletedPost });
};
