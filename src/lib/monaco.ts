import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

export function addCodeBlock(editor: Monaco.editor.IStandaloneCodeEditor, language: string) {
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (!model || !selection) return;
	const text = model.getValueInRange(selection);
	const code = `\`\`\`${language}\n${text}\n\`\`\``;
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

export function addCutComment(
	editor: Monaco.editor.IStandaloneCodeEditor,
	mode: 'before' | 'after'
) {
	const selection = editor.getSelection();
	const model = editor.getModel();
	if (!model || !selection) return;
	const comment = mode === 'before' ? '// ---cut-before---' : '// ---cut-after---';
	const code = `\n${comment}\n`;
	editor.executeEdits('', [
		{
			range: selection,
			text: code,
			forceMoveMarkers: true
		}
	]);
	editor.focus();
	editor.setPosition({
		lineNumber: selection.endLineNumber + 2,
		column: -1
	});
}
