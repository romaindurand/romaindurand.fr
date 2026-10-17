import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeCodeBlock } from '#lib/rehype-code-block.js';
import { shikiOptions } from '#lib/shiki-options.js';

async function render(markdown: string) {
	const file = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeShiki, { ...shikiOptions, langs: ['ts'] })
		.use(rehypeCodeBlock)
		.use(rehypeStringify)
		.process(markdown);
	return String(file);
}

describe('code block pipeline', () => {
	it('gives a fence without a language Shiki line spans (needed for numbers and copy)', async () => {
		const out = await render('```\nplain\nline2\n```');
		expect(out).toContain('<div class="codeblock">');
		expect(out.match(/<span class="line">/g)).toHaveLength(2);
		expect(out).toContain('data-language="text"');
	});

	it('keeps line spans for a fence with a language', async () => {
		const out = await render('```ts\nconst a = 1;\n```');
		expect(out).toContain('<span class="line">');
		expect(out).toContain('<span>ts</span>');
	});
});
