import { error, type RequestEvent } from '@sveltejs/kit';

export function checkAuth(event: RequestEvent) {
	if (event.locals.authenticated) return;
	error(401, 'not logged in');
}

export function isAuthenticated(event: RequestEvent) {
	return event.locals.authenticated;
}
