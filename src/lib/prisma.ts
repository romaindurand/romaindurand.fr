import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getPosts(limit = 10, offset = 0) {
	return prisma.post.findMany({
		take: limit,
		skip: offset,
		orderBy: {
			createdAt: 'desc'
		}
	});
}

export function getPost(id: number) {
	return prisma.post.findUnique({
		where: { id }
	});
}

export async function deletePost(id: number) {
	return await prisma.post.delete({
		where: {
			id
		}
	});
}
