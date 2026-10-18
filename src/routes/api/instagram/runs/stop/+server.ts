import { isApiAuthorized } from '#lib/instagram/api-auth.js';
import { requestStop } from '#lib/instagram/runs.js';
import type { RequestHandler } from './$types';

/** Demande l'arrêt propre du job en cours. */
export const POST: RequestHandler = async (event) => {
	if (!(await isApiAuthorized(event))) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}
	return Response.json({ stopped: await requestStop() });
};
