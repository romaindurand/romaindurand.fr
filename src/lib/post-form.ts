import { type RequestEvent } from '@sveltejs/kit';
import { checkAuth } from './auth';

export async function handlePostForm(event: RequestEvent) {
	checkAuth(event);
	const data = await event.request.formData();
	const content = data.get('content')?.toString() || '';
	const title = data.get('title')?.toString() || '';
	const chapo = data.get('chapo')?.toString() || '';
	const published = Boolean(data.get('published'));
	const craetedAtValue = data.get('createdAt')?.toString();
	const createdAt = craetedAtValue ? new Date(craetedAtValue).toISOString() : '';

	return { title, chapo, content, published, createdAt };
}
