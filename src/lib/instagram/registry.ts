import { prisma } from '#lib/prisma.js';
import { buildDraft } from './draft';
import { fetchWithTimeout } from './http';
import { downloadTo, extFromUrl, mediaRelPath, posterRelPath } from './media-storage';
import type { Ingestor, Registry, SourceState } from './sync';
import type { IgItem } from './types';

const connectTags = (names: string[]) =>
	[...new Set(names)].map((name) => ({ where: { name }, create: { name } }));

/** Registre d'ingestion stocké en base (tables `InstagramItem`, `InstagramItemSource`, `InstagramSource`). */
export class PrismaRegistry implements Registry {
	async getSourceState(key: string): Promise<SourceState | null> {
		const row = await prisma.instagramSource.findUnique({ where: { key } });
		return row && { oldestCursor: row.oldestCursor, hasMoreOlder: row.hasMoreOlder };
	}

	async saveSourceState(key: string, state: SourceState) {
		const data = { ...state, lastRunAt: new Date() };
		await prisma.instagramSource.upsert({ where: { key }, update: data, create: { key, ...data } });
	}

	async hasItem(pk: string) {
		return (await prisma.instagramItem.count({ where: { pk } })) > 0;
	}

	async hasItemSource(pk: string, source: string) {
		const row = await prisma.instagramItemSource.findUnique({
			where: { itemPk_source: { itemPk: pk, source } }
		});
		return row !== null;
	}

	async addItemSource(pk: string, source: string) {
		await prisma.instagramItemSource.upsert({
			where: { itemPk_source: { itemPk: pk, source } },
			update: {},
			create: { itemPk: pk, source }
		});
	}

	async addTagsToPost(pk: string, tags: string[]) {
		const item = await prisma.instagramItem.findUnique({ where: { pk }, select: { postId: true } });
		if (!item?.postId) return;
		await prisma.post.update({
			where: { id: item.postId },
			data: { tags: { connectOrCreate: connectTags(tags) } }
		});
	}
}

/**
 * Crée le brouillon, ses tags et la ligne de registre. Seule une vidéo est téléchargée dans
 * `mediaDir` ; images et carrousels sont intégrés par l'embed (voir `buildDraft`).
 */
export class PrismaIngestor implements Ingestor {
	constructor(
		private mediaDir: string,
		private fetchFn: typeof fetch = fetchWithTimeout(300_000)
	) {}

	async ingest(item: IgItem, tags: string[]) {
		const draft = buildDraft(item);
		const videos =
			item.type === 'video' ? item.media.filter((entry) => entry.kind === 'video') : [];
		const media = [];
		for (const entry of videos) {
			const path = mediaRelPath(item.pk, item.takenAt, entry.index, extFromUrl(entry.url, 'video'));
			const posterPath = entry.posterUrl ? posterRelPath(item.pk, item.takenAt, entry.index) : null;
			let downloaded = true;
			try {
				await downloadTo(this.mediaDir, path, entry.url, this.fetchFn);
				if (posterPath && entry.posterUrl) {
					await downloadTo(this.mediaDir, posterPath, entry.posterUrl, this.fetchFn);
				}
			} catch {
				downloaded = false;
			}
			media.push({
				position: entry.index,
				sourceIndex: entry.index,
				kind: 'video',
				path,
				posterPath,
				width: entry.width,
				height: entry.height,
				status: downloaded ? 'ok' : 'missing'
			});
		}
		await prisma.post.create({
			data: {
				...draft,
				published: false,
				createdAt: item.takenAt,
				tags: { connectOrCreate: connectTags(tags) },
				media: { create: media },
				instagram: {
					create: {
						pk: item.pk,
						code: item.code,
						url: item.url,
						author: item.author,
						caption: item.caption,
						type: item.type,
						takenAt: item.takenAt
					}
				}
			}
		});
	}
}
