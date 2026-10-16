import { describe, it, expect } from 'vitest';
import { getActiveIndex, navItems } from '#lib/nav.js';

describe('getActiveIndex', () => {
	it.each([
		['/', 0],
		['/post/vixen-confronts-jamie-9', 0],
		['/projects', 1],
		['/contact', 2],
		['/about', 3],
		['/about/', 3]
	])('%s -> %i', (pathname, expected) => {
		expect(getActiveIndex(pathname)).toBe(expected);
	});

	it('exposes the four entries in design order', () => {
		expect(navItems.map((i) => i.label)).toEqual(['BLOG', 'PROJETS', 'CONTACT', 'À PROPOS']);
		expect(navItems.map((i) => i.path)).toEqual(['~/blog', '~/projets', '~/contact', '~/a-propos']);
	});
});
