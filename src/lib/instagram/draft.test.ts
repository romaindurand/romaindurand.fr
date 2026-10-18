import { describe, expect, it } from 'vitest';
import { buildDraft, escapeHtml } from './draft';

const url = 'https://www.instagram.com/p/AAA/';
const photo = { author: 'alice', caption: '', url, code: 'AAA', type: 'image' as const };

describe('buildDraft', () => {
	it('uses the first non-empty caption line as title', () => {
		const draft = buildDraft({ ...photo, caption: '\n\nHello world\nsecond line' });
		expect(draft.title).toBe('Hello world');
		expect(draft.chapo).toBe('@alice · Instagram');
	});
	it('truncates long titles to 80 characters with an ellipsis', () => {
		const title = buildDraft({ ...photo, caption: 'x'.repeat(200) }).title;
		expect([...title]).toHaveLength(80);
		expect(title.endsWith('…')).toBe(true);
	});
	it('falls back to @author without caption', () => {
		const draft = buildDraft({ ...photo, caption: '   ' });
		expect(draft.title).toBe('@alice');
		expect(draft.content).toBe(`<Instagram code="AAA" />\n\n[Voir sur Instagram](${url})`);
	});
	it('embeds images and carousels on their own line, after the caption', () => {
		const draft = buildDraft({ ...photo, caption: 'one\ntwo' });
		expect(draft.content).toBe(
			`one  \ntwo\n\n<Instagram code="AAA" />\n\n[Voir sur Instagram](${url})`
		);
		expect(buildDraft({ ...photo, type: 'carousel' }).content).toContain(
			'<Instagram code="AAA" />'
		);
	});
	it('does not embed a video (it is played from the list), the link is enough', () => {
		const draft = buildDraft({ ...photo, type: 'video', caption: 'Un reel' });
		expect(draft.content).toBe(`Un reel\n\n[Voir sur Instagram](${url})`);
	});
	it('omits the embed tag when the code is unsafe', () => {
		const draft = buildDraft({ ...photo, code: 'A"/><script>alert(1)</script>' });
		expect(draft.content).not.toContain('<Instagram');
		expect(draft.content).not.toContain('<script');
	});
	it('escapes raw HTML in the caption (the markdown renderer allows HTML)', () => {
		const draft = buildDraft({
			...photo,
			caption: '<script>alert(1)</script> & <img src=x onerror=alert(1)>'
		});
		expect(draft.content).not.toContain('<script');
		expect(draft.content).not.toContain('<img');
		expect(draft.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;img');
	});
});

describe('escapeHtml', () => {
	it('escapes &, < and >', () => {
		expect(escapeHtml('a & <b>')).toBe('a &amp; &lt;b&gt;');
	});
});
