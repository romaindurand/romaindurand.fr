import { isApiAuthorized } from '#lib/instagram/api-auth.js';
import { getCurrentRun } from '#lib/instagram/runs.js';
import { getSession } from '#lib/instagram/session.js';
import type { RequestHandler } from './$types';

/** Dernier job (en cours ou terminé) et état de la session. */
export const GET: RequestHandler = async (event) => {
	if (!(await isApiAuthorized(event))) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}
	const [run, session] = await Promise.all([getCurrentRun(), getSession()]);
	return Response.json({
		run,
		session: { status: session.status, blockedUntil: session.blockedUntil?.toISOString() ?? null }
	});
};
