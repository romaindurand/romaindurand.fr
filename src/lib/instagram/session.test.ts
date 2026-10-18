import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db';
import {
	DEFAULT_SETTINGS,
	createToken,
	getSession,
	getSettings,
	loadCookies,
	normalizeSettings,
	parseCookiePayload,
	saveCookies,
	saveSettings,
	setBlockedUntil,
	setStatus,
	verifyToken
} from './session';

afterEach(resetDb);
const secret = 'a-long-random-secret-of-at-least-32-chars';
const cookies = { sessionid: 's', csrftoken: 'c', ds_user_id: '1', mid: 'm' };

describe('parseCookiePayload', () => {
	it('accepts a payload with the required cookies', () => {
		expect(parseCookiePayload({ cookies })).toEqual(cookies);
	});
	it('rejects a missing required cookie, bad shapes and bad names', () => {
		expect(parseCookiePayload({ cookies: { sessionid: 's', csrftoken: 'c' } })).toBeNull();
		expect(parseCookiePayload(null)).toBeNull();
		expect(parseCookiePayload({ cookies: 'x' })).toBeNull();
		expect(parseCookiePayload({ cookies: { ...cookies, 'bad name': 'x' } })).toBeNull();
		expect(parseCookiePayload({ cookies: { ...cookies, mid: 5 } })).toBeNull();
		expect(parseCookiePayload({ cookies: { ...cookies, mid: 'a; sessionid=evil' } })).toBeNull();
		expect(parseCookiePayload({ cookies: { ...cookies, mid: 'a\r\nX: y' } })).toBeNull();
		expect(parseCookiePayload({ cookies: { ...cookies, mid: '' } })).toBeNull();
	});
});

describe('normalizeSettings', () => {
	it('keeps valid integers and falls back to defaults', () => {
		expect(normalizeSettings({ batchSize: '50', mediaBatchSize: 'x', maxRequests: 0 })).toEqual({
			...DEFAULT_SETTINGS,
			batchSize: 50
		});
	});
	it('keeps a trimmed repostsDocId', () => {
		expect(normalizeSettings({ repostsDocId: ' 123 ' }).repostsDocId).toBe('123');
	});
});

describe('session persistence', () => {
	it('starts missing, then ok after saving cookies, which are encrypted at rest', async () => {
		expect((await getSession()).status).toBe('missing');
		await saveCookies(cookies, secret);
		const session = await getSession();
		expect(session.status).toBe('ok');
		expect(session.cookies).not.toContain('sessionid');
		expect(await loadCookies(secret)).toEqual(cookies);
	});
	it('returns null when the cookies cannot be decrypted', async () => {
		await saveCookies(cookies, secret);
		expect(await loadCookies('another-secret-another-secret-123456')).toBeNull();
	});
	it('stores status and the block deadline', async () => {
		await setStatus('expired');
		const until = new Date('2030-01-01T00:00:00Z');
		await setBlockedUntil(until);
		const session = await getSession();
		expect(session.status).toBe('expired');
		expect(session.blockedUntil).toEqual(until);
		await setBlockedUntil(null);
		expect((await getSession()).blockedUntil).toBeNull();
	});
	it('issues a token whose hash is stored and which verifies', async () => {
		const token = await createToken();
		expect((await getSession()).tokenHash).not.toBe(token);
		expect(await verifyToken(token)).toBe(true);
		expect(await verifyToken('wrong')).toBe(false);
		const second = await createToken();
		expect(await verifyToken(token)).toBe(false);
		expect(await verifyToken(second)).toBe(true);
	});
	it('rejects any token when none was issued', async () => {
		expect(await verifyToken('anything')).toBe(false);
	});
	it('reads defaults then saved settings', async () => {
		expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
		await saveSettings({ batchSize: 10 });
		expect((await getSettings()).batchSize).toBe(10);
	});
});
