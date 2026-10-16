import type { Element, Root, RootContent } from 'hast';

/**
 * Plugin rehype : enveloppe chaque `<pre>` dans un `.codeblock` avec une barre
 * (langage à gauche, bouton COPIER à droite). Le clic est géré par `PostBody.svelte`.
 */
export function rehypeCodeBlock() {
	return (tree: Root) => {
		wrap(tree);
	};
}

function wrap(parent: Root | Element) {
	parent.children = parent.children.map((child: RootContent) => {
		// `@shikijs/rehype` replaces each `<pre>` with the `Root` returned by `codeToHast`,
		// so root nodes can appear nested inside the tree.
		if ((child.type as string) === 'root') {
			wrap(child as unknown as Root);
			return child;
		}
		if (child.type !== 'element') return child;
		if (child.tagName === 'pre') return codeBlock(child);
		wrap(child);
		return child;
	});
}

function codeBlock(pre: Element): Element {
	// rehype-parse yields `dataLanguage`; the Shiki transformer sets the raw `data-language` key
	const language = String(
		pre.properties?.dataLanguage ?? pre.properties?.['data-language'] ?? 'texte'
	);
	return {
		type: 'element',
		tagName: 'div',
		properties: { className: ['codeblock'] },
		children: [
			{
				type: 'element',
				tagName: 'div',
				properties: { className: ['codebar'] },
				children: [
					{
						type: 'element',
						tagName: 'span',
						properties: {},
						children: [{ type: 'text', value: language }]
					},
					{
						type: 'element',
						tagName: 'button',
						properties: { type: 'button', className: ['copybtn'], dataCopy: true },
						children: [{ type: 'text', value: 'COPIER' }]
					}
				]
			},
			pre
		]
	};
}
