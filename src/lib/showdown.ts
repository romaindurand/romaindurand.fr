import showdown from 'showdown';
import showdownHighlight from 'showdown-highlight';

// source : https://github.com/showdownjs/showdown/issues/588#issuecomment-425278067
showdown.extension('preserveHTML', function () {
	return [
		{
			type: 'listener',
			listeners: {
				'hashHTMLBlocks.after': function (event, text, converter, options, globals) {
					text = text.replace(/^ {0,3}<[a-z]+\b[^>]*>$/gim, function (wm) {
						return '\n\n¨K' + ((globals.gHtmlBlocks?.push(wm) || 1) - 1) + 'K\n\n';
					});
					return text;
				}
			}
		}
	];
});

export const converter = new showdown.Converter({
	extensions: [
		showdownHighlight({
			auto_detection: true
		}),
		'preserveHTML'
	]
});
