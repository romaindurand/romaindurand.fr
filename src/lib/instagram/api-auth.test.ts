import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db';
import { bearerToken, isApiAuthorized } from './api-auth';
import { createToken } from './session';

afterEach(resetDb);

const event = (headers: Record<string, string>, authenticated = false) =>
	({
		request: new Request('http://localhost/api', { method: 'POST', headers }),
		locals: { authenticated }
	}) as Parameters<typeof isApiAuthorized>[0];

describe('bearerToken', () => {
	it('extracts the token', () => {
		expect(
			bearerToken(new Request('http://x', { headers: { authorization: 'Bearer abc_123' } }))
		).toBe('abc_123');
	});
	it('returns null for missing or malformed headers', () => {
		expect(bearerToken(new Request('http://x'))).toBeNull();
		expect(
			bearerToken(new Request('http://x', { headers: { authorization: 'Basic abc' } }))
		).toBeNull();
		expect(
			bearerToken(new Request('http://x', { headers: { authorization: 'Bearer' } }))
		).toBeNull();
	});
});

describe('isApiAuthorized', () => {
	it('accepts the current ingest token', async () => {
		const token = await createToken();
		expect(await isApiAuthorized(event({ authorization: `Bearer ${token}` }))).toBe(true);
	});
	it('rejects a wrong token and anonymous calls', async () => {
		await createToken();
		expect(await isApiAuthorized(event({ authorization: 'Bearer nope' }))).toBe(false);
		expect(await isApiAuthorized(event({}))).toBe(false);
	});
	it('accepts the admin session cookie unless tokenOnly', async () => {
		expect(await isApiAuthorized(event({}, true))).toBe(true);
		expect(await isApiAuthorized(event({}, true), { tokenOnly: true })).toBe(false);
	});
});
