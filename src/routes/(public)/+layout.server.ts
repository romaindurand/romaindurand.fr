import { isAuthenticated } from '$lib/auth';

export async function load(event) {
	const isAdmin = isAuthenticated(event);
	return {
		isAdmin
	};
}
