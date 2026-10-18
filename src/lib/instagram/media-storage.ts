import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, rm, rmdir } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'mp4']);
const MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.mp4': 'video/mp4'
};

/** Chemin relatif d'un média : `<année>/<pk>/<index>.<ext>`. */
export function mediaRelPath(pk: string, takenAt: Date, index: number, ext: string) {
	return `${takenAt.getUTCFullYear()}/${pk}/${index}.${ext}`;
}

/** Chemin relatif de l'affiche d'une vidéo. */
export function posterRelPath(pk: string, takenAt: Date, index: number) {
	return `${takenAt.getUTCFullYear()}/${pk}/${index}-poster.jpg`;
}

/** Extension d'après l'URL (liste blanche), sinon `jpg` pour une image et `mp4` pour une vidéo. */
export function extFromUrl(url: string, kind: 'image' | 'video') {
	const ext = extname(new URL(url).pathname).slice(1).toLowerCase();
	return EXTENSIONS.has(ext) ? ext : kind === 'video' ? 'mp4' : 'jpg';
}

/** Chemin absolu d'un média, ou `null` s'il sort de `mediaDir`. */
export function resolveMediaPath(mediaDir: string, rel: string): string | null {
	const base = resolve(mediaDir);
	const full = resolve(base, rel);
	const path = relative(base, full);
	const escapes = path === '..' || path.startsWith(`..${sep}`);
	return path && !escapes && !isAbsolute(path) ? full : null;
}

/** Type MIME d'après l'extension. */
export function mimeFromPath(path: string) {
	return MIME[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

/** Télécharge `url` vers `rel` (fichier `.part` renommé à la fin) ; lève si la réponse n'est pas OK. */
export async function downloadTo(
	mediaDir: string,
	rel: string,
	url: string,
	fetchFn: typeof fetch = fetch
) {
	const dest = resolveMediaPath(mediaDir, rel);
	if (!dest) throw new Error(`Chemin média invalide : ${rel}`);
	await mkdir(dirname(dest), { recursive: true });
	const tmp = `${dest}.${randomUUID()}.part`;
	try {
		const response = await fetchFn(url);
		if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
		await pipeline(Readable.fromWeb(response.body as never), createWriteStream(tmp));
		await rename(tmp, dest);
	} catch (error) {
		await rm(tmp, { force: true });
		throw error;
	}
}

/** Vrai si le fichier existe dans `mediaDir`. */
export async function fileExists(mediaDir: string, rel: string) {
	const path = resolveMediaPath(mediaDir, rel);
	if (!path) return false;
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

/** Supprime les fichiers, puis leurs dossiers devenus vides ; ignore les fichiers absents. */
export async function removeMediaFiles(mediaDir: string, rels: string[]) {
	const dirs = new Set<string>();
	for (const rel of rels) {
		const path = resolveMediaPath(mediaDir, rel);
		if (!path) continue;
		await rm(path, { force: true });
		dirs.add(dirname(path));
	}
	for (const dir of dirs) {
		try {
			await rmdir(dir);
		} catch {
			// dossier non vide ou déjà supprimé
		}
	}
}

/** Interprète un en-tête `Range` : `null` (absent), `'invalid'` (416) ou les octets demandés. */
export function parseRange(header: string | null, size: number) {
	if (!header) return null;
	const match = /^bytes=(\d*)-(\d*)$/.exec(header);
	if (!match || (match[1] === '' && match[2] === '')) return 'invalid' as const;
	let start: number;
	let end: number;
	if (match[1] === '') {
		start = Math.max(size - Number(match[2]), 0);
		end = size - 1;
	} else {
		start = Number(match[1]);
		end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
	}
	return start > end || start >= size ? ('invalid' as const) : { start, end };
}
