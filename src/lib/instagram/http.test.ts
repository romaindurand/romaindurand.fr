import { describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout } from './http';

describe('fetchWithTimeout', () => {
	it('aborts a request that never answers', async () => {
		const hanging = vi.fn(
			(_input: unknown, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
				})
		);
		vi.stubGlobal('fetch', hanging);
		try {
			await expect(fetchWithTimeout(20)('https://example.test/')).rejects.toBeDefined();
			expect(hanging).toHaveBeenCalledOnce();
		} finally {
			vi.unstubAllGlobals();
		}
	});
	it('keeps a signal already provided by the caller', async () => {
		const spy = vi.fn(async () => new Response('{}'));
		vi.stubGlobal('fetch', spy);
		try {
			const signal = new AbortController().signal;
			await fetchWithTimeout(20)('https://example.test/', { signal });
			expect((spy.mock.calls[0] as unknown[])[1]).toMatchObject({ signal });
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
