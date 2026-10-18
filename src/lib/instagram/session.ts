import { prisma } from '#lib/prisma.js';
import { decrypt, encrypt, generateToken, safeEqualHex, sha256Hex } from './crypto';
import type { IgCookies } from './types';

export type SessionStatus = 'ok' | 'expired' | 'missing';

/** Réglages modifiables depuis l'admin, stockés en JSON dans `InstagramSession.settings`. */
export interface IgSettings {
	batchSize: number;
	mediaBatchSize: number;
	maxRequests: number;
	repostsDocId: string;
}

export const DEFAULT_SETTINGS: IgSettings = {
	batchSize: 100,
	mediaBatchSize: 25,
	maxRequests: 60,
	repostsDocId: ''
};

const REQUIRED_COOKIES = ['sessionid', 'csrftoken', 'ds_user_id'];

/** Valide le corps envoyé par le userscript ; renvoie les cookies ou `null`. */
export function parseCookiePayload(body: unknown): IgCookies | null {
	const raw = (body as { cookies?: unknown } | null)?.cookies;
	if (!raw || typeof raw !== 'object') return null;
	const entries = Object.entries(raw as Record<string, unknown>);
	if (entries.length === 0 || entries.length > 40) return null;
	const cookies: IgCookies = {};
	for (const [name, value] of entries) {
		if (!/^[\w.-]{1,64}$/.test(name)) return null;
		// ASCII imprimable sans espace ni `;` : la valeur est réinjectée telle quelle dans l'en-tête `Cookie`.
		if (typeof value !== 'string' || value.length > 4096 || !/^[\x21-\x3a\x3c-\x7e]+$/.test(value))
			return null;
		cookies[name] = value;
	}
	return REQUIRED_COOKIES.every((name) => name in cookies) ? cookies : null;
}

const positiveInt = (value: unknown, fallback: number) => {
	const number = Number(value);
	return Number.isInteger(number) && number >= 1 && number <= 1000 ? number : fallback;
};

/** Valide des réglages saisis ; toute valeur invalide retombe sur la valeur par défaut. */
export function normalizeSettings(input: Record<string, unknown>): IgSettings {
	return {
		batchSize: positiveInt(input.batchSize, DEFAULT_SETTINGS.batchSize),
		mediaBatchSize: positiveInt(input.mediaBatchSize, DEFAULT_SETTINGS.mediaBatchSize),
		maxRequests: positiveInt(input.maxRequests, DEFAULT_SETTINGS.maxRequests),
		repostsDocId: typeof input.repostsDocId === 'string' ? input.repostsDocId.trim() : ''
	};
}

/** La ligne unique de session (créée au besoin). */
export function getSession() {
	return prisma.instagramSession.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

/** Chiffre et enregistre les cookies, statut `ok`. */
export async function saveCookies(cookies: IgCookies, secret: string) {
	await getSession();
	await prisma.instagramSession.update({
		where: { id: 1 },
		data: { cookies: encrypt(JSON.stringify(cookies), secret), status: 'ok' }
	});
}

/** Déchiffre les cookies ; `null` s'il n'y en a pas ou s'ils sont illisibles. */
export async function loadCookies(secret: string): Promise<IgCookies | null> {
	const { cookies } = await getSession();
	if (!cookies) return null;
	try {
		return JSON.parse(decrypt(cookies, secret)) as IgCookies;
	} catch {
		return null;
	}
}

export async function setStatus(status: SessionStatus) {
	await getSession();
	await prisma.instagramSession.update({ where: { id: 1 }, data: { status } });
}

export async function setBlockedUntil(date: Date | null) {
	await getSession();
	await prisma.instagramSession.update({ where: { id: 1 }, data: { blockedUntil: date } });
}

/** Génère un nouveau jeton d'ingestion (le précédent cesse de fonctionner) ; seul son hash est stocké. */
export async function createToken(): Promise<string> {
	const token = generateToken();
	await getSession();
	await prisma.instagramSession.update({ where: { id: 1 }, data: { tokenHash: sha256Hex(token) } });
	return token;
}

/** Vrai si `token` correspond au jeton d'ingestion courant. */
export async function verifyToken(token: string): Promise<boolean> {
	const { tokenHash } = await getSession();
	return !!tokenHash && safeEqualHex(sha256Hex(token), tokenHash);
}

export async function getSettings(): Promise<IgSettings> {
	const { settings } = await getSession();
	try {
		return normalizeSettings(JSON.parse(settings));
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export async function saveSettings(input: Record<string, unknown>): Promise<IgSettings> {
	const settings = normalizeSettings({ ...(await getSettings()), ...input });
	await getSession();
	await prisma.instagramSession.update({
		where: { id: 1 },
		data: { settings: JSON.stringify(settings) }
	});
	return settings;
}
