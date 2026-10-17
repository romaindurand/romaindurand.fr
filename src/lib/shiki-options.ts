import { createCssVariablesTheme, type ShikiTransformer } from 'shiki';

const codeTheme = createCssVariablesTheme({
	name: 'css-variables',
	variablePrefix: '--shiki-',
	variableDefaults: {},
	fontStyle: true
});

/**
 * Options Shiki partagées par le rendu Markdown. `defaultLanguage` fait passer les blocs
 * sans langage par Shiki aussi, pour qu'ils aient des `.line` (numéros, copie).
 */
export const shikiOptions = {
	theme: codeTheme,
	defaultLanguage: 'text',
	transformers: [
		{
			name: 'data-language',
			pre(node) {
				node.properties['data-language'] = this.options.lang;
			}
		}
	] satisfies ShikiTransformer[]
};
