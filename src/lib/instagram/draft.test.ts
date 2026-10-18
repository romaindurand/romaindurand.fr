import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { buildDraft, escapeHtml, escapeMarkdown } from './draft';

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
		expect(draft.content).toContain('&lt;script&gt;alert\\(1\\)&lt;/script&gt; &amp; &lt;img');
	});
});

describe('buildDraft rendered like /render (allowDangerousHtml)', () => {
	const render = (markdown: string) =>
		String(
			unified()
				.use(remarkParse)
				.use(remarkGfm)
				.use(remarkRehype, { allowDangerousHtml: true })
				.use(rehypeStringify, { allowDangerousHtml: true })
				.processSync(markdown)
		);
	const link = `[Voir sur Instagram](${url})`;

	it.each([
		'[Voir](javascript:alert(1))',
		'![x](javascript:alert(1))',
		'[x]: javascript:alert(1)\n\n[x]',
		'[x]: javascript:alert(1)\n[x]',
		'<script>alert(1)</script>',
		'<img src=x onerror=alert(1)>',
		'# titre\n- item\n> citation\n*bold* _it_ `code` ~~strike~~ @a_b_c'
	])('renders the caption %j as text, without link, image or script', (caption) => {
		const { content } = buildDraft({ ...photo, type: 'video', caption });
		// Le lien « Voir sur Instagram » est légitime : on ne rend que la légende.
		const html = render(content.replace(link, ''));
		expect(html).not.toContain('<a');
		expect(html).not.toContain('<img');
		expect(html).not.toContain('<script');
		expect(html).not.toContain('href="javascript:');
	});

	it('keeps the legitimate Instagram link', () => {
		const html = render(buildDraft({ ...photo, type: 'video', caption: 'Un reel' }).content);
		expect(html).toContain(`<a href="${url}">Voir sur Instagram</a>`);
	});
});

describe('escapeMarkdown', () => {
	it('backslash-escapes markdown specials', () => {
		expect(escapeMarkdown('\\`*_[]()!#>~|')).toBe('\\\\\\`\\*\\_\\[\\]\\(\\)\\!\\#\\>\\~\\|');
	});
	it('leaves plain text untouched', () => {
		expect(escapeMarkdown('Hello, world. 1 + 1')).toBe('Hello, world. 1 + 1');
	});
});

describe('escapeHtml', () => {
	it('escapes &, < and >', () => {
		expect(escapeHtml('a & <b>')).toBe('a &amp; &lt;b&gt;');
	});
});
