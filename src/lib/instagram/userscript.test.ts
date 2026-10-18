import { describe, expect, it } from 'vitest';
import { buildUserscript } from './userscript';

describe('buildUserscript', () => {
	const script = buildUserscript('https://romaindurand.fr');

	it('declares the metadata block ViolentMonkey needs', () => {
		expect(script.startsWith('// ==UserScript==')).toBe(true);
		expect(script).toContain('// @match        https://www.instagram.com/*');
		expect(script).toContain('// @grant        GM_cookie');
		expect(script).toContain('// @grant        GM_xmlhttpRequest');
		expect(script).toContain('// @connect      romaindurand.fr');
		expect(script).toContain('// ==/UserScript==');
	});

	it('targets the blog session endpoint with a safely quoted origin', () => {
		expect(script).toContain('const BASE = "https://romaindurand.fr";');
		expect(script).toContain("'/api/instagram/session'");
	});

	it('never embeds a token', () => {
		expect(script).not.toMatch(/Bearer [A-Za-z0-9_-]{20,}/);
	});

	it('quotes hostile origins as data, not code', () => {
		const hostile = buildUserscript('https://x.test/?"+alert(1)+"');
		expect(hostile).toContain('const BASE = "https://x.test/?\\"+alert(1)+\\"";');
	});
});
