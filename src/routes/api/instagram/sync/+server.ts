import { INSTAGRAM_SECRET, MEDIA_DIR } from '$app/env/private';
import { isApiAuthorized } from '#lib/instagram/api-auth.js';
import { JobRejected, startJob } from '#lib/instagram/runner.js';
import type { RunKind } from '#lib/instagram/runs.js';
import type { RequestHandler } from './$types';

const KINDS: Record<string, RunKind> = {
	new: 'sync-new',
	older: 'sync-older',
	media: 'media',
	scan: 'scan'
};

/** Lance un job : `mode=new|older|media|scan`, `postId` (avec `media`) pour un seul post. */
export const POST: RequestHandler = async (event) => {
	if (!(await isApiAuthorized(event))) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}
	const kind = KINDS[event.url.searchParams.get('mode') ?? 'new'];
	if (!kind) return Response.json({ error: 'Mode inconnu' }, { status: 400 });
	const postIdParam = event.url.searchParams.get('postId');
	const postId = postIdParam === null ? undefined : Number(postIdParam);
	if (postId !== undefined && !(Number.isInteger(postId) && postId > 0)) {
		return Response.json({ error: 'postId invalide' }, { status: 400 });
	}
	try {
		const runId = await startJob(
			kind,
			{ mediaDir: MEDIA_DIR, secret: INSTAGRAM_SECRET },
			{ postId }
		);
		return Response.json({ runId }, { status: 202 });
	} catch (error) {
		if (error instanceof JobRejected) {
			return Response.json({ error: error.message }, { status: error.status });
		}
		throw error;
	}
};
