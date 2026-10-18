import { getSession } from '#lib/instagram/session.js';
import type { LayoutServerLoad } from './$types';

/** Expose le statut de la session Instagram aux pages admin (pour le bandeau d'alerte). */
export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.authenticated) return { igStatus: null };
	return { igStatus: (await getSession()).status };
};
