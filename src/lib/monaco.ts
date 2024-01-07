import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as monaco from 'monaco-editor';

// Import the workers in a production-safe way.
// This is different than in Monaco's documentation for Vite,
// but avoids a weird error ("Unexpected usage") at runtime
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
	getWorker: function (_: string, label: string) {
		switch (label) {
			case 'json':
				return new jsonWorker();
			case 'css':
			case 'scss':
			case 'less':
				return new cssWorker();
			case 'html':
			case 'handlebars':
			case 'razor':
				return new htmlWorker();
			case 'typescript':
			case 'javascript':
				return new tsWorker();
			default:
				return new editorWorker();
		}
	}
};

export function addCodeBlock(editor: Monaco.editor.IStandaloneCodeEditor) {
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (!model || !selection) return;
	const text = model.getValueInRange(selection);
	const code = `\`\`\`js\n${text}\n\`\`\``;
	editor.executeEdits('', [
		{
			range: selection,
			text: code,
			forceMoveMarkers: true
		}
	]);
	editor.focus();
	editor.setPosition({
		lineNumber: selection.endLineNumber + 1,
		column: -1
	});
}

export default monaco;
