import { describe, expect, it } from 'vitest';
import {
	instagramEmbedUrl,
	instagramPostUrl,
	instagramTag,
	isInstagramCode
} from '#lib/instagram-embed.js';
import { parseTag, splitOnComponent } from '#lib/markdown.js';

describe('isInstagramCode', () => {
	it('accepts letters, digits, underscore and dash', () => {
		expect(isInstagramCode('DAbc_123-x')).toBe(true);
	});
	it('rejects anything that could break out of an attribute, a url or a path', () => {
		for (const code of ['', 'a"b', 'a b', '../x', 'a/b', '<b>', 'a\nb', 'x'.repeat(65)]) {
			expect(isInstagramCode(code)).toBe(false);
		}
	});
});

describe('urls and tag', () => {
	it('builds the post and embed urls', () => {
		expect(instagramPostUrl('AAA111')).toBe('https://www.instagram.com/p/AAA111/');
		expect(instagramEmbedUrl('AAA111')).toBe('https://www.instagram.com/p/AAA111/embed/');
	});
	it('builds the markdown tag, or null for an unsafe code', () => {
		expect(instagramTag('AAA111')).toBe('<Instagram code="AAA111" />');
		expect(instagramTag('a"b')).toBeNull();
	});
	it('round-trips through the markdown component pipeline', () => {
		const html = `<p>a</p>\n${instagramTag('AAA111')}\n<p>b</p>\n`;
		const lines = splitOnComponent(html, ['Instagram']);
		expect(lines).toEqual(['<p>a</p>', '<Instagram code="AAA111" />', '<p>b</p>']);
		expect(parseTag(lines[1])).toEqual({ name: 'Instagram', attributes: { code: 'AAA111' } });
	});
});
