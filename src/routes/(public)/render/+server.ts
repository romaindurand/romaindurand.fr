import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';
import { json, type RequestHandler } from '@sveltejs/kit';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGFM from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import { rendererClassic, transformerTwoslash } from '@shikijs/twoslash';
import rehypeStringify from 'rehype-stringify';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const markdown = body.markdown;

	const sha = sha256(markdown);
	const cached = cache.get(sha);
	if (cached) {
		return json({ html: cached });
	}

	const html = await render(markdown);
	cache.set(sha, html);

	return json({ html });
};

async function render(markdown: string) {
	const ast = processor.parse(markdown);
	const root = await processor.run(ast);
	const html = processor.stringify(root);
	// hide comments : // @ts-ignore hide
	return html.replaceAll(
		/(\n)?<span class="line"><span style="[^"]*">\s*\/\/\s*?@ts-ignore hide<\/span><\/span>(\n)?/gm,
		''
	);
}

const lruOptions = {
	max: 100
};
const cache = new LRUCache<string, string>(lruOptions);

const processor = unified()
	.use(remarkParse)
	.use(remarkGFM)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeSlug)
	.use(rehypeShiki, {
		theme: 'one-dark-pro',
		transformers: [
			transformerTwoslash({
				explicitTrigger: true,
				renderer: rendererClassic()
			})
		]
	})
	.use(rehypeStringify, { allowDangerousHtml: true });

const sha256 = (input: string) => {
	return createHash('sha256').update(input).digest('hex');
};
