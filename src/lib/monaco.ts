import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

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
