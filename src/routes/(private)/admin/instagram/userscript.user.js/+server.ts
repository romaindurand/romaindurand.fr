import { buildUserscript } from '#lib/instagram/userscript.js';
import type { RequestHandler } from './$types';

/** Sert le userscript, avec l'origine du blog injectée. ViolentMonkey l'installe depuis cette URL. */
export const GET: RequestHandler = ({ url }) =>
	new Response(buildUserscript(url.origin), {
		headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }
	});
