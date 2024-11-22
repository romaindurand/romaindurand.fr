// import showdown from 'showdown';
// import { createShikiHighlighter, renderCodeToHTML, runTwoSlash } from 'shiki-twoslash';

// // source : https://github.com/showdownjs/showdown/issues/588#issuecomment-425278067
// showdown.extension('preserveHTML', function () {
// 	return [
// 		{
// 			type: 'listener',
// 			listeners: {
// 				'hashHTMLBlocks.after': function (event, text, converter, options, globals) {
// 					text = text.replace(/^ {0,3}<[a-z]+\b[^>]*>$/gim, function (wm) {
// 						return '\n\n¨K' + ((globals.gHtmlBlocks?.push(wm) || 1) - 1) + 'K\n\n';
// 					});
// 					return text;
// 				}
// 			}
// 		}
// 	];
// });

// export const converter = new showdown.Converter({
// 	extensions: [shikiTwoslash({}), 'preserveHTML']
// });

// const highlighter = await createShikiHighlighter({ theme: 'dark-plus' });

// function shikiTwoslash(options) {
// 	return [
// 		{
// 			type: 'output',
// 			filter: function (text, converter, options) {
// 				const preCodeReplaceRegex = /<pre><code.*>([\s\S]*?)<\/code><\/pre>/g;
// 				const codeMatches = text.match(preCodeReplaceRegex);
// 				codeMatches.forEach((preCode: string) => {
// 					preCodeReplaceRegex.lastIndex = 0;
// 					const execResult = preCodeReplaceRegex.exec(preCode);
// 					const code = '// @errors: 7022 2322 2448 2304\n' + execResult?.[1];
// 					let html = '';
// 					try {
// 						const twoslash = runTwoSlash(code, 'ts', {});
// 						html = renderCodeToHTML(
// 							twoslash.code,
// 							'ts',
// 							{ twoslash: true },
// 							{ themeName: 'one-dark-pro' },
// 							highlighter,
// 							twoslash
// 						);
// 						text = text.replace(preCode, html);
// 					} catch (e: unknown) {
// 						if ('message' in e) {
// 							text = text.replace(preCode, `<pre><code>${e.message}\n\n${code}</code></pre>`);
// 						}
// 					} finally {
// 						text = text.replace(preCode, html);
// 					}
// 				});
// 				return text;
// 			}
// 		}
// 	];
// }
