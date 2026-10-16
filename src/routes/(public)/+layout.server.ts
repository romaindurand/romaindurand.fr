import { isAuthenticated } from '#lib/auth.js';

export async function load(event) {
	const isAdmin = isAuthenticated(event);
	return {
		isAdmin
	};
}
