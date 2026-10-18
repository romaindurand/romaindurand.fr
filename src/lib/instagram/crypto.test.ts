import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, generateToken, safeEqualHex, sha256Hex } from './crypto';

const secret = 'a-long-random-secret-of-at-least-32-chars';

describe('encrypt / decrypt', () => {
	it('round-trips', () => {
		expect(decrypt(encrypt('{"sessionid":"abc"}', secret), secret)).toBe('{"sessionid":"abc"}');
	});
	it('produces a different ciphertext each time', () => {
		expect(encrypt('x', secret)).not.toBe(encrypt('x', secret));
	});
	it('fails with a wrong secret', () => {
		expect(() => decrypt(encrypt('x', secret), 'another-secret-another-secret-123456')).toThrow();
	});
	it('fails when the payload is tampered with', () => {
		const [iv, tag, data] = encrypt('hello', secret).split('.');
		const flipped = Buffer.from(data, 'base64');
		flipped[0] ^= 1;
		expect(() => decrypt([iv, tag, flipped.toString('base64')].join('.'), secret)).toThrow();
	});
	it('fails when the auth tag is truncated', () => {
		const [iv, tag, data] = encrypt('hello', secret).split('.');
		const short = Buffer.from(tag, 'base64').subarray(0, 4).toString('base64');
		expect(() => decrypt([iv, short, data].join('.'), secret)).toThrow();
	});
});

describe('tokens', () => {
	it('generates distinct url-safe tokens', () => {
		const a = generateToken();
		expect(a).toMatch(/^[A-Za-z0-9_-]{40,}$/);
		expect(generateToken()).not.toBe(a);
	});
	it('hashes and compares in constant time', () => {
		expect(sha256Hex('abc')).toHaveLength(64);
		expect(safeEqualHex(sha256Hex('abc'), sha256Hex('abc'))).toBe(true);
		expect(safeEqualHex(sha256Hex('abc'), sha256Hex('abd'))).toBe(false);
		expect(safeEqualHex('zz', sha256Hex('abc'))).toBe(false);
	});
});
