/** Cookies Instagram, nom → valeur. */
export type IgCookies = Record<string, string>;

/** Un média (image ou vidéo) d'une publication ; `index` est son rang dans le carrousel. */
export interface IgMedia {
	index: number;
	kind: 'image' | 'video';
	url: string;
	posterUrl?: string;
	width: number;
	height: number;
}

/** Une publication Instagram normalisée. */
export interface IgItem {
	pk: string;
	code: string;
	url: string;
	author: string;
	caption: string;
	takenAt: Date;
	type: 'image' | 'video' | 'carousel';
	media: IgMedia[];
}

/** Une page d'un flux ; `nextCursor` vaut `null` à la fin du flux. */
export interface IgPage {
	items: IgItem[];
	nextCursor: string | null;
}

/** Un flux synchronisable (`liked`, `reposted`, `saved`, `saved:<collection>`) et les tags qu'il apporte. */
export interface IgSource {
	key: string;
	tags: string[];
}

/** Accès à Instagram, remplaçable par un faux dans les tests. */
export interface InstagramClient {
	listSources(): Promise<IgSource[]>;
	fetchPage(source: string, cursor: string | null): Promise<IgPage>;
	/** Renvoie `null` si la publication est supprimée ou privée. */
	fetchItem(pk: string): Promise<IgItem | null>;
}

/** La session n'est plus valide (connexion requise, checkpoint). */
export class SessionExpiredError extends Error {
	name = 'SessionExpiredError';
}

/** Instagram demande de ralentir (429, `feedback_required`). */
export class RateLimitedError extends Error {
	name = 'RateLimitedError';
}

/** Réponse HTTP inattendue d'Instagram. */
export class InstagramHttpError extends Error {
	name = 'InstagramHttpError';
	constructor(
		readonly status: number,
		message?: string
	) {
		super(message ?? `HTTP ${status}`);
	}
}
