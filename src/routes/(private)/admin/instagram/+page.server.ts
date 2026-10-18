import { checkAuth } from '#lib/auth.js';
import { createToken, getSession, getSettings, saveSettings } from '#lib/instagram/session.js';
import { prisma } from '#lib/prisma.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
	const [session, settings, states, memberships, mediaCounts] = await Promise.all([
		getSession(),
		getSettings(),
		prisma.instagramSource.findMany(),
		prisma.instagramItemSource.groupBy({ by: ['source'], _count: { _all: true } }),
		prisma.postMedia.groupBy({ by: ['status'], _count: { _all: true } })
	]);
	const stateByKey = new Map(states.map((state) => [state.key, state]));
	const counts = new Map(memberships.map((row) => [row.source, row._count._all]));
	const keys = [...new Set([...counts.keys(), ...stateByKey.keys()])].sort((a, b) =>
		a.localeCompare(b, 'fr')
	);
	return {
		session: {
			status: session.status,
			updatedAt: session.updatedAt.toISOString(),
			hasToken: !!session.tokenHash,
			blockedUntil: session.blockedUntil?.toISOString() ?? null
		},
		settings,
		sources: keys.map((key) => ({
			key,
			count: counts.get(key) ?? 0,
			hasMoreOlder: stateByKey.get(key)?.hasMoreOlder ?? null,
			lastRunAt: stateByKey.get(key)?.lastRunAt?.toISOString() ?? null
		})),
		mediaCounts: Object.fromEntries(
			mediaCounts.map((row) => [row.status, row._count._all])
		) as Record<string, number>
	};
};

export const actions: Actions = {
	/** Génère un nouveau jeton d'ingestion (affiché une seule fois). */
	generateToken: async (event) => {
		checkAuth(event);
		return { token: await createToken() };
	},
	saveSettings: async (event) => {
		checkAuth(event);
		const data = await event.request.formData();
		await saveSettings(Object.fromEntries(data));
		return { saved: true };
	}
};
