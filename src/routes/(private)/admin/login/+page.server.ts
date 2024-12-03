import { error, redirect } from '@sveltejs/kit';
import { sessionDuration, sessions } from '../../../../stores/sessions';
import type { Actions } from './$types';
import { v4 as uuid } from 'uuid';
import { env } from '$env/dynamic/private';

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const key = data.get('key') as string;
		if (key !== env.LOGIN_KEY) {
			error(401, 'login failed');
		}
		const id = uuid();
		event.cookies.set('session', id, {
			path: '/'
		});
		sessions.update((sessions) => [...sessions, id]);
		setTimeout(() => {
			sessions.update((sessions) => sessions.filter((s) => s !== id));
		}, sessionDuration);

		redirect(302, '/admin');
	}
};
