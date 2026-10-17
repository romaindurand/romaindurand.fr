import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import type { Root } from 'hast';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { rehypeCodeBlock } from '#lib/rehype-code-block.js';

async function run(html: string) {
	const file = await unified()
		.use(rehypeParse, { fragment: true })
		.use(rehypeCodeBlock)
		.use(rehypeStringify)
		.process(html);
	return String(file);
}

describe('rehypeCodeBlock', () => {
	it('wraps a pre with a language bar and a copy button', async () => {
		const out = await run('<pre data-language="ts"><code><span class="line">a</span></code></pre>');
		expect(out).toContain('<div class="codeblock">');
		expect(out).toContain('<span>ts</span>');
		expect(out).toContain('data-copy');
		expect(out).toContain('<pre data-language="ts">');
	});

	it('falls back to "texte" when no language is known', async () => {
		const out = await run('<pre><code>a</code></pre>');
		expect(out).toContain('<span>texte</span>');
	});

	it('reads the language from a raw data-language property, as the Shiki transformer sets it', async () => {
		const setRawLanguage = () => (tree: Root) => {
			const pre = tree.children[0];
			if (pre.type === 'element') pre.properties = { 'data-language': 'ts' };
		};
		const file = await unified()
			.use(rehypeParse, { fragment: true })
			.use(setRawLanguage)
			.use(rehypeCodeBlock)
			.use(rehypeStringify)
			.process('<pre><code>a</code></pre>');
		expect(String(file)).toContain('<span>ts</span>');
	});

	it('leaves other elements untouched', async () => {
		expect(await run('<p>x</p>')).toBe('<p>x</p>');
	});

	it('wraps a pre nested in a root node, as @shikijs/rehype produces', async () => {
		// @shikijs/rehype replaces <pre> with the Root returned by codeToHast
		const nestRootInRoot = () => (tree: Root) => {
			tree.children = [
				{ type: 'root', children: tree.children } as unknown as Root['children'][number]
			];
		};
		const file = await unified()
			.use(rehypeParse, { fragment: true })
			.use(nestRootInRoot)
			.use(rehypeCodeBlock)
			.use(rehypeStringify)
			.process('<pre data-language="ts"><code>a</code></pre>');
		expect(String(file)).toContain('<div class="codeblock">');
	});
});
