import type { Prisma } from '../../generated/prisma/client';

/** `all` : l'article doit avoir tous les tags (ET) ; `any` : au moins un (OU). */
export type TagMode = 'all' | 'any';
export type PostStatus = 'all' | 'draft' | 'published';
export interface TagFilter {
	tags: string[];
	mode: TagMode;
}

export const HOME_PAGE_SIZE = 30;
export const ADMIN_PAGE_SIZE = 50;

/** Découpe une saisie « a, b, c » en noms de tags nettoyés et dédoublonnés. */
export function parseTagInput(input: string): string[] {
	return [
		...new Set(
			input
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean)
		)
	];
}

/** Nombre maximal de tags pris en compte depuis l'URL (les suivants sont ignorés). */
export const MAX_TAGS = 10;

/** Lit `tags` (liste séparée par des virgules ou paramètre répété, `MAX_TAGS` au plus) et `mode` dans l'URL. */
export function parseTagFilter(params: URLSearchParams): TagFilter {
	return {
		tags: parseTagInput(params.getAll('tags').join(',')).slice(0, MAX_TAGS),
		mode: params.get('mode') === 'any' ? 'any' : 'all'
	};
}

/** Lit le paramètre `status` (`draft`, `published`, sinon `all`). */
export function parseStatus(params: URLSearchParams): PostStatus {
	const status = params.get('status');
	return status === 'draft' || status === 'published' ? status : 'all';
}

/** Lit le paramètre `page` (entier de 1 à 9999, strict ; sinon 1). */
export function parsePage(params: URLSearchParams): number {
	const page = params.get('page') ?? '';
	return /^[1-9]\d{0,3}$/.test(page) ? Number(page) : 1;
}

/** Ajoute le tag s'il est absent, le retire sinon. */
export function toggleTag(filter: TagFilter, tag: string): TagFilter {
	const tags = filter.tags.includes(tag)
		? filter.tags.filter((name) => name !== tag)
		: [...filter.tags, tag];
	return { ...filter, tags };
}

/** Sérialise le filtre en query string (`''` ou `'?…'`). Le mode par défaut n'est pas écrit. */
export function tagFilterQuery(
	filter: TagFilter,
	extra: { status?: PostStatus; page?: number } = {}
): string {
	const params = new URLSearchParams();
	if (filter.tags.length) params.set('tags', filter.tags.join(','));
	if (filter.tags.length > 1 && filter.mode === 'any') params.set('mode', 'any');
	if (extra.status && extra.status !== 'all') params.set('status', extra.status);
	if (extra.page && extra.page > 1) params.set('page', String(extra.page));
	const query = params.toString();
	return query ? `?${query}` : '';
}

/** Condition Prisma sur `Post.tags` correspondant au filtre. */
export function buildTagWhere(filter: TagFilter): Prisma.PostWhereInput {
	if (!filter.tags.length) return {};
	if (filter.mode === 'any') return { tags: { some: { name: { in: filter.tags } } } };
	return { AND: filter.tags.map((name) => ({ tags: { some: { name } } })) };
}

export interface Part {
	text: string;
	strong?: boolean;
}

const SUBJECT = { all: 'Articles', draft: 'Brouillons', published: 'Articles publiés' } as const;
const EVERYTHING = {
	all: 'Tous les articles',
	draft: 'Tous les brouillons',
	published: 'Tous les articles publiés'
} as const;

/** Phrase qui dit précisément ce qui est listé, découpée pour mettre les tags en gras. */
export function describeSelection(filter: TagFilter, status: PostStatus, count: number): Part[] {
	const parts: Part[] = [];
	if (!filter.tags.length) {
		parts.push({ text: EVERYTHING[status] });
	} else if (filter.tags.length === 1) {
		parts.push({ text: `${SUBJECT[status]} avec le tag ` }, { text: filter.tags[0], strong: true });
	} else {
		const joiner = filter.mode === 'all' ? ' ET ' : ' OU ';
		parts.push({ text: `${SUBJECT[status]} ayant ` });
		filter.tags.forEach((tag, index) => {
			if (index) parts.push({ text: joiner });
			parts.push({ text: tag, strong: true });
		});
		if (filter.mode === 'any') {
			parts.push({ text: filter.tags.length === 2 ? ' (ou les deux)' : ' (ou plusieurs)' });
		}
	}
	parts.push({ text: ` : ${count}` });
	return parts;
}

/** Version texte brut de {@link describeSelection}. */
export function describeSelectionText(filter: TagFilter, status: PostStatus, count: number) {
	return describeSelection(filter, status, count)
		.map((part) => part.text)
		.join('');
}
