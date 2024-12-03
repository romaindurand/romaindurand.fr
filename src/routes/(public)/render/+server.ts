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
	const html = await render(markdown);
	return json({ html });
};

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

async function render(markdown: string) {
	const ast = processor.parse(markdown);
	const root = await processor.run(ast);
	const html = processor.stringify(root);
	// hide comments : // @ts-ignore hide
	return html.replaceAll(
		/\n<span class="line"><span style="[^"]*">\s*\/\/\s*?@ts-ignore hide<\/span><\/span>/gm,
		''
	);
}
