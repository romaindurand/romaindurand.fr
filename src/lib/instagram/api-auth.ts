import type { RequestEvent } from '@sveltejs/kit';
import { verifyToken } from './session';

/** Extrait le jeton d'un en-tête `Authorization: Bearer <jeton>`. */
export function bearerToken(request: Request): string | null {
	const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '');
	return match ? match[1] : null;
}

/** Autorise un jeton d'ingestion valide, ou (sauf `tokenOnly`) la session admin. */
export async function isApiAuthorized(
	event: Pick<RequestEvent, 'request' | 'locals'>,
	opts: { tokenOnly?: boolean } = {}
): Promise<boolean> {
	const token = bearerToken(event.request);
	if (token && (await verifyToken(token))) return true;
	return !opts.tokenOnly && event.locals.authenticated;
}
