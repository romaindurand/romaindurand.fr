import type { Handle } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sessions } from './stores/sessions';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');
	console.log({ sessionCookie });
	const currentSessions = get(sessions);
	console.log({ currentSessions });
	event.locals.authenticated = !!get(sessions).find((s) => s === sessionCookie);

	const response = await resolve(event);
	return response;
};
