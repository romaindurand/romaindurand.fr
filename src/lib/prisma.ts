import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { buildTagWhere, type TagMode } from './tag-filter';

const adapter = new PrismaBetterSqlite3({
	url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
});
/** Client Prisma partagé. */
export const prisma = new PrismaClient({ adapter });

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

const tagsInclude = { select: { name: true }, orderBy: { name: 'asc' } } as const;

const connectTags = (names: string[]) =>
	names.map((name) => ({ where: { name }, create: { name } }));

/** Options communes de `listPosts` et `countPosts`. */
export interface PostListOptions {
	published?: boolean;
	tags?: string[];
	mode?: TagMode;
	limit?: number;
	offset?: number;
	orderBy?: 'createdAt' | 'id';
	onlyOkMedia?: boolean;
}

function postWhere({
	published,
	tags = [],
	mode = 'all'
}: Pick<PostListOptions, 'published' | 'tags' | 'mode'>): Prisma.PostWhereInput {
	return {
		...(published === undefined ? {} : { published }),
		...buildTagWhere({ tags, mode })
	};
}

/** Liste paginée (sans `content`) avec tags et médias, filtrable par statut et par tags. */
export function listPosts(opts: PostListOptions = {}) {
	const { limit = 30, offset = 0, orderBy = 'createdAt', onlyOkMedia = false } = opts;
	return prisma.post.findMany({
		where: postWhere(opts),
		take: limit,
		skip: offset,
		orderBy: orderBy === 'id' ? [{ id: 'desc' }] : [{ createdAt: 'desc' }, { id: 'desc' }],
		omit: { content: true },
		include: {
			tags: tagsInclude,
			media: { where: onlyOkMedia ? { status: 'ok' } : undefined, orderBy: { position: 'asc' } }
		}
	});
}

/** Élément retourné par `listPosts`. */
export type PostListItem = Awaited<ReturnType<typeof listPosts>>[number];

/** Nombre de posts correspondant au même filtre que `listPosts`. */
export function countPosts(opts: Pick<PostListOptions, 'published' | 'tags' | 'mode'> = {}) {
	return prisma.post.count({ where: postWhere(opts) });
}

/** Tags non vides avec leur nombre de posts (publiés seulement si `published` vaut `true`). */
export async function getTagCounts(published?: boolean) {
	const tags = await prisma.tag.findMany({
		select: {
			name: true,
			_count: { select: { posts: { where: published === undefined ? undefined : { published } } } }
		}
	});
	return tags
		.map((tag) => ({ name: tag.name, count: tag._count.posts }))
		.filter((tag) => tag.count > 0)
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));
}

/** Tous les noms de tags existants, triés (suggestions du formulaire). */
export async function getAllTagNames() {
	const tags = await prisma.tag.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
	return tags.map((tag) => tag.name);
}

/** Chemins des fichiers médias d'un post (à lire avant sa suppression). */
export function getMediaFiles(postId: number) {
	return prisma.postMedia.findMany({
		where: { postId },
		select: { path: true, posterPath: true }
	});
}

/** Post avec ses tags et ses médias. */
export function getPost(id: number) {
	return prisma.post.findUnique({
		where: { id },
		include: { tags: tagsInclude, media: { orderBy: { position: 'asc' } } }
	});
}

export async function deletePost(id: number) {
	return await prisma.post.delete({
		where: {
			id
		}
	});
}

/** Crée un post ; `tags` (optionnel) sont créés au besoin puis rattachés. */
export async function createPost(post: {
	title: string;
	chapo: string;
	content: string;
	published: boolean;
	createdAt: string;
	tags?: string[];
}) {
	const { title, chapo, content, published, createdAt, tags } = post;
	return prisma.post.create({
		data: {
			content,
			title,
			chapo,
			published,
			createdAt,
			...(tags ? { tags: { connectOrCreate: connectTags(tags) } } : {})
		}
	});
}

/** Met à jour un post ; `tags` remplace les tags existants, et les laisse intacts s'il est omis. */
export async function updatePost(
	id: number,
	post: {
		title: string;
		chapo: string;
		content: string;
		createdAt: string;
		published: boolean;
		tags?: string[];
	}
) {
	const { title, chapo, content, createdAt, published, tags } = post;
	const data = { title, chapo, content, createdAt, published };
	if (!tags) return prisma.post.update({ data, where: { id } });
	const [, updated] = await prisma.$transaction([
		prisma.post.update({ where: { id }, data: { tags: { set: [] } } }),
		prisma.post.update({
			where: { id },
			data: { ...data, tags: { connectOrCreate: connectTags(tags) } }
		})
	]);
	return updated;
}
