import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getPosts(limit = 100, offset = 0) {
	return prisma.post.findMany({
		take: limit,
		skip: offset,
		orderBy: {
			createdAt: 'desc'
		},
		where: {
			published: true
		}
	});
}

export function getAllPosts() {
	return prisma.post.findMany({
		orderBy: {
			id: 'desc'
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

export async function createPost(post: {
	title: string;
	chapo: string;
	content: string;
	published: boolean;
	createdAt: string;
}) {
	const { title, chapo, content, published, createdAt } = post;
	return prisma.post.create({
		data: { content, title, chapo, published, createdAt }
	});
}

export async function updatePost(
	id: number,
	post: { title: string; chapo: string; content: string; createdAt: string; published: boolean }
) {
	const { title, chapo, content, createdAt, published } = post;
	return prisma.post.update({
		data: { title, chapo, content, createdAt, published },
		where: { id }
	});
}
