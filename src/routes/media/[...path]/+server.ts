import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MEDIA_DIR } from '$app/env/private';
import { prisma } from '#lib/prisma.js';
import { mimeFromPath, parseRange, resolveMediaPath } from '#lib/instagram/media-storage.js';

export const GET: RequestHandler = async ({ params, request }) => {
	const file = resolveMediaPath(MEDIA_DIR, params.path);
	if (!file) error(404, 'Média introuvable');

	// seuls les types connus sont servis (pas de `.part` en cours de téléchargement)
	if (mimeFromPath(file) === 'application/octet-stream') error(404, 'Média introuvable');

	let size: number;
	try {
		const info = await stat(file);
		if (!info.isFile()) error(404, 'Média introuvable');
		size = info.size;
	} catch (e) {
		if ((e as { status?: number }).status === 404) throw e;
		// auto-correction : un fichier absent n'est plus « ok » (seulement sur ENOENT)
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			await prisma.postMedia.updateMany({
				where: { status: 'ok', OR: [{ path: params.path }, { posterPath: params.path }] },
				data: { status: 'missing' }
			});
		}
		error(404, 'Média introuvable');
	}

	const headers = {
		'Content-Type': mimeFromPath(file),
		'Accept-Ranges': 'bytes',
		'Cache-Control': 'public, max-age=31536000, immutable'
	};
	const range = parseRange(request.headers.get('range'), size);
	if (range === 'invalid') {
		return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
	}
	if (range) {
		const stream = Readable.toWeb(createReadStream(file, range)) as ReadableStream;
		return new Response(stream, {
			status: 206,
			headers: {
				...headers,
				'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
				'Content-Length': String(range.end - range.start + 1)
			}
		});
	}
	return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
		headers: { ...headers, 'Content-Length': String(size) }
	});
};
