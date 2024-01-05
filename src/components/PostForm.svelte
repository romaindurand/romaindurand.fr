<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import type { Post } from '@prisma/client';
	import PostPreview from './PostPreview.svelte';

	export let post: Post | null = null;

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;

	let showPreview = false;
	let content = post?.content || "```js\nconst test = 'toto';\n```";

	function adjustHeight(textarea: HTMLTextAreaElement) {
		resetHeight();
		textarea.oninput = resetHeight;

		function resetHeight() {
			textarea.style.height = '';
			textarea.style.height = textarea.scrollHeight + 2 + 'px';
		}
	}

	onMount(async () => {
		monaco = (await import('$lib/monaco')).default;

		const editor = monaco.editor.create(editorContainer, {
			value: content,
			language: 'markdown',
			wordWrap: 'on',
			scrollBeyondLastLine: false,
			minimap: {
				enabled: false
			}
		});
		const model = monaco.editor.createModel(content, 'markdown');
		model.onDidChangeContent(() => {
			content = model.getValue();
		});
		editor.setModel(model);
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
</script>

<form method="post">
	<h1>{post ? 'Edit' : 'New'} post</h1>
	<div class="container">
		<div>
			<input type="text" placeholder="Titre" name="title" required value={post ? post.title : ''} />
		</div>
		<div>
			<textarea name="chapo" use:adjustHeight placeholder="Chapo">{post ? post.chapo : ''}</textarea
			>
		</div>
		<div>
			<div class="tabs">
				<button
					class="tab"
					class:active={!showPreview}
					on:click|preventDefault={() => (showPreview = false)}>Edit</button
				>
				<button
					class="tab"
					class:active={showPreview}
					on:click|preventDefault={() => (showPreview = true)}
				>
					Preview
				</button>
			</div>
			<div class="preview" class:hidden={!showPreview}>
				<PostPreview markdown={content} />
			</div>
			<div class="editor" class:hidden={showPreview} bind:this={editorContainer} />
			<textarea name="content" bind:value={content} class="hidden" use:adjustHeight />
		</div>
		<button type="submit">{post ? 'Update' : 'Create'}</button>
	</div>
</form>

<style>
	.editor {
		width: 100%;
		height: 600px;
		border: 1px solid #ccc;
		border-radius: 0px;
	}

	.container {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}

	.hidden {
		display: none;
	}

	.preview {
		border: 1px solid #ccc;
		padding: 1rem;
	}

	.tabs {
		display: flex;
		gap: -1px;
	}

	.tabs button {
		padding: 0.5rem;
		cursor: pointer;
		border: 1px solid #ccc;
		border-radius: 0.5rem 0.5rem 0 0;
		border-bottom: none;
		background-color: #fff;
	}
	.tabs button.active {
		font-weight: bold;
		border-color: #000;
	}

	input,
	textarea {
		border: 1px solid #ccc;
		border-radius: 0px;
		padding: 1rem;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus-visible,
	textarea:focus-visible {
		outline-offset: -2px;
		box-sizing: border-box;
		outline: 2px solid var(--color-text);
		border-radius: 0px;
	}

	textarea {
		height: 1rem;
		resize: vertical;
	}
	button[type='submit'] {
		padding: 1rem;
		background: var(--color-text);
		color: var(--color-background);
		border: none;
		cursor: pointer;
	}
</style>
