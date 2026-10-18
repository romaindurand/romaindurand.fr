import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { handlePostForm } from '#lib/post-form.js';

function event(fields: Record<string, string>, authenticated = true) {
	const body = new FormData();
	for (const [name, value] of Object.entries(fields)) body.set(name, value);
	return {
		locals: { authenticated },
		request: new Request('http://localhost/admin/new', { method: 'POST', body })
	} as unknown as RequestEvent;
}

describe('handlePostForm', () => {
	it('parses the tags field into a clean list', async () => {
		const result = await handlePostForm(
			event({ title: 't', tags: ' like, La base ,, like', published: 'on' })
		);
		expect(result.tags).toEqual(['like', 'La base']);
		expect(result.published).toBe(true);
	});

	it('returns an empty list when there is no tags field', async () => {
		expect((await handlePostForm(event({ title: 't' }))).tags).toEqual([]);
	});

	it('refuses anonymous submissions', async () => {
		await expect(handlePostForm(event({ title: 't' }, false))).rejects.toMatchObject({
			status: 401
		});
	});
});
