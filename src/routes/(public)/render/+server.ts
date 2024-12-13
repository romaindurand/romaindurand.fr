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
import { isAuthenticated } from '$lib/auth';

export const POST: RequestHandler = async (event) => {
	const { request } = event;

	// use admin cookie auth for post preview
	// use env secret for public posts rendering
	const renderAuth = request.headers.get('x-render-auth');
	if (renderAuth !== process.env.LOGIN_KEY && !isAuthenticated(event)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const markdown = body.markdown;

	// look for a cached version of the rendered markdown before rendering
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
	try {
		const ast = processor.parse(markdown);
		const root = await processor.run(ast);
		const html = processor.stringify(root);
		// hide comments : // @ts-ignore hide
		return html.replaceAll(
			/<span class="line"><span style="[^"]*">\s*\/\/\s*?@ts-ignore hide<\/span><\/span>(\n)?/gm,
			''
		);
	} catch (error: unknown) {
		if (error instanceof TwoSlashError) {
			// normalize line endings
			let fixedMarkdown = markdown.replaceAll('\r\n', '\n');
			// replace the twoslash code block with a custom element and the code block without twoslash
			fixedMarkdown = fixedMarkdown.replace(
				'```ts twoslash\n' + error.code,
				`<TwoslashError ` +
					`title="${cleanAttribute(error.title)}" ` +
					`recommendation="${cleanAttribute(error.recommendation)}" ` +
					`description="${cleanAttribute(error.description)}" />\n` +
					'\n```ts\n' +
					error.code
			);
			return render(fixedMarkdown);
		}
	}
}

function cleanAttribute(value: string) {
	return value.replaceAll('\n', '<br>');
}

const lruOptions = {
	max: 100
};
const cache = new LRUCache<string, string>(lruOptions);

class TwoSlashError extends Error {
	code: string = '';
	title: string = '';
	description: string = '';
	recommendation: string = '';
}

const processor = unified()
	.use(remarkParse)
	.use(remarkGFM)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeSlug)
	.use(rehypeShiki, {
		theme: 'one-dark-pro',
		transformers: [
			transformerTwoslash({
				onTwoslashError: (error, code) => {
					const err = new TwoSlashError();
					err.code = code;
					const { title, description, recommendation } = error as TwoSlashError;
					Object.assign(err, { title, description, recommendation });
					throw err;
				},
				explicitTrigger: true,
				throws: false,
				renderer: rendererClassic()
			})
		]
	})
	.use(rehypeStringify, { allowDangerousHtml: true });

const sha256 = (input: string) => {
	return createHash('sha256').update(input).digest('hex');
};
