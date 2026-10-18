import { instagramPostUrl, isInstagramCode } from '../instagram-embed';
import type { IgSettings } from './session';
import {
	InstagramHttpError,
	RateLimitedError,
	SessionExpiredError,
	type IgCookies,
	type IgItem,
	type IgMedia,
	type IgPage,
	type IgSource,
	type InstagramClient
} from './types';

// Les réponses privées d'Instagram ne sont pas typées et changent sans préavis : on les garde
// volontairement souples ici, et nulle part ailleurs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const ORIGIN = 'https://www.instagram.com';
const APP_ID = '936619743392459';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:158.0) Gecko/20100101 Firefox/158.0';

function mapNode(node: Raw, index: number): IgMedia | null {
	const image = node.image_versions2?.candidates?.[0];
	const video = node.video_versions?.[0];
	const url = video?.url ?? image?.url;
	if (!url) return null;
	return {
		index,
		kind: video ? 'video' : 'image',
		url,
		...(video && image?.url ? { posterUrl: image.url } : {}),
		width: node.original_width ?? image?.width ?? video?.width ?? 1080,
		height: node.original_height ?? image?.height ?? video?.height ?? 1080
	};
}

/** Convertit un média brut d'Instagram ; `null` s'il n'a ni code ni média exploitable. */
export function mapMedia(raw: Raw): IgItem | null {
	const code = raw?.code;
	if (typeof code !== 'string' || !isInstagramCode(code)) return null;
	const type = raw.media_type === 8 ? 'carousel' : raw.media_type === 2 ? 'video' : 'image';
	const nodes: Raw[] = type === 'carousel' ? (raw.carousel_media ?? []) : [raw];
	const media = nodes
		.map((node, index) => mapNode(node, index))
		.filter((entry): entry is IgMedia => entry !== null);
	if (media.length === 0) return null;
	const pk = String(raw.pk ?? raw.id ?? '').split('_')[0];
	if (!pk) return null;
	return {
		pk,
		code,
		url: instagramPostUrl(code),
		author: raw.user?.username ?? 'inconnu',
		caption: raw.caption?.text ?? '',
		takenAt: new Date((raw.taken_at ?? 0) * 1000),
		type,
		media
	};
}

const mapItems = (list: Raw[]) =>
	list.map(mapMedia).filter((item): item is IgItem => item !== null);

/** Options du client HTTP : réglages de synchronisation et `fetch` injectable (tests). */
export interface ClientOptions {
	settings: IgSettings;
	fetchFn?: typeof fetch;
}

/** Client des endpoints web internes d'Instagram, authentifié par les cookies de session. */
export class HttpInstagramClient implements InstagramClient {
	private collections = new Map<string, string>();
	private fetchFn: typeof fetch;

	constructor(
		private cookies: IgCookies,
		private options: ClientOptions
	) {
		this.fetchFn = options.fetchFn ?? fetch;
	}

	private headers() {
		return {
			accept: '*/*',
			'user-agent': USER_AGENT,
			referer: `${ORIGIN}/`,
			'x-ig-app-id': APP_ID,
			'x-asbd-id': '129477',
			'x-requested-with': 'XMLHttpRequest',
			'x-csrftoken': this.cookies.csrftoken,
			cookie: Object.entries(this.cookies)
				.map(([name, value]) => `${name}=${value}`)
				.join('; ')
		};
	}

	/** GET JSON ; `null` sur un 404. Lève `SessionExpiredError`, `RateLimitedError` ou `InstagramHttpError`. */
	protected async request(path: string, params: Record<string, string> = {}): Promise<Raw | null> {
		const url = new URL(path, ORIGIN);
		for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
		const response = await this.fetchFn(url, { headers: this.headers(), redirect: 'manual' });
		if (response.status >= 300 && response.status < 400) {
			throw new SessionExpiredError('Redirection vers la page de connexion');
		}
		if (response.status === 429) throw new RateLimitedError('HTTP 429');
		if (!(response.headers.get('content-type') ?? '').includes('json')) {
			if (response.status === 404) return null;
			// Une page d'erreur serveur n'invalide pas la session.
			if (response.status >= 500) throw new InstagramHttpError(response.status);
			throw new SessionExpiredError('Réponse non JSON (page de connexion ?)');
		}
		const body = await response.json().catch(() => {
			throw new InstagramHttpError(response.status, 'Réponse JSON invalide');
		});
		if (
			response.status === 401 ||
			body?.message === 'login_required' ||
			body?.require_login ||
			body?.message === 'checkpoint_required'
		) {
			throw new SessionExpiredError(body?.message ?? 'Session expirée');
		}
		if (body?.message === 'feedback_required') throw new RateLimitedError('feedback_required');
		if (response.status === 404) return null;
		if (!response.ok) throw new InstagramHttpError(response.status, body?.message);
		return body;
	}

	async listSources(): Promise<IgSource[]> {
		const sources: IgSource[] = [
			{ key: 'liked', tags: ['like'] },
			{ key: 'saved', tags: ['saved'] }
		];
		this.collections.clear();
		let cursor: string | null = null;
		do {
			const body: Raw = await this.request('/api/v1/collections/list/', {
				collection_types: '["MEDIA"]',
				...(cursor ? { max_id: cursor } : {})
			});
			for (const collection of body?.items ?? []) {
				if (collection.collection_type !== 'MEDIA' || !collection.collection_name) continue;
				const key = `saved:${collection.collection_name}`;
				this.collections.set(key, String(collection.collection_id));
				sources.push({ key, tags: ['saved', collection.collection_name] });
			}
			cursor = body?.more_available ? (body.next_max_id ?? null) : null;
		} while (cursor);
		return sources;
	}

	async fetchPage(source: string, cursor: string | null): Promise<IgPage> {
		const params: Record<string, string> = cursor ? { max_id: cursor } : {};
		let path: string;
		let unwrap = (entry: Raw): Raw => entry;
		if (source === 'liked') {
			path = '/api/v1/feed/liked/';
		} else if (source === 'saved') {
			path = '/api/v1/feed/saved/posts/';
			unwrap = (entry) => entry.media;
		} else if (this.collections.has(source)) {
			path = `/api/v1/feed/collection/${this.collections.get(source)}/posts/`;
			unwrap = (entry) => entry.media;
		} else {
			throw new Error(`Source inconnue : ${source}`);
		}
		const body = await this.request(path, params);
		return {
			items: mapItems((body?.items ?? []).map(unwrap)),
			nextCursor: body?.more_available ? (body.next_max_id ?? null) : null
		};
	}

	async fetchItem(pk: string): Promise<IgItem | null> {
		const body = await this.request(`/api/v1/media/${encodeURIComponent(pk)}/info/`);
		return mapItems(body?.items ?? [])[0] ?? null;
	}
}
