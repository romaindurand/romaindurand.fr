import { error, type RequestEvent } from '@sveltejs/kit';

export function checkAuth(event: RequestEvent) {
	if (!event.locals.authenticated) {
		error(401, 'not logged in');
	}
}
