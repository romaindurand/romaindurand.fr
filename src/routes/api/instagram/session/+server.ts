import { INSTAGRAM_SECRET } from '$app/env/private';
import { isApiAuthorized } from '#lib/instagram/api-auth.js';
import { parseCookiePayload, saveCookies } from '#lib/instagram/session.js';
import type { RequestHandler } from './$types';

/** Reçoit les cookies envoyés par le userscript (jeton d'ingestion requis). */
export const POST: RequestHandler = async (event) => {
	if (!(await isApiAuthorized(event, { tokenOnly: true }))) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}
	const cookies = parseCookiePayload(await event.request.json().catch(() => null));
	if (!cookies) {
		return Response.json(
			{ error: 'Cookies invalides : sessionid, csrftoken et ds_user_id sont requis' },
			{ status: 400 }
		);
	}
	await saveCookies(cookies, INSTAGRAM_SECRET);
	return Response.json({ status: 'ok' });
};
