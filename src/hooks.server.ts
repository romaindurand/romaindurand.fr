import type { Handle } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { sessions } from './stores/sessions';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');
	event.locals.authenticated = !!get(sessions).find((s) => s === sessionCookie);

	const response = await resolve(event);
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
	response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
	return response;
};
