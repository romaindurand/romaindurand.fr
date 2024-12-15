<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import type { Post } from '@prisma/client';
	import { addCodeBlock, addCutComment } from '$lib/monaco';
	import PostBody from './PostBody.svelte';
	import LinkButton from './LinkButton.svelte';

	interface Props {
		post?: Post | null;
	}

	let { post = null }: Props = $props();

	let editor: Monaco.editor.IStandaloneCodeEditor | undefined = $state();
	let editorContainer: HTMLElement | undefined = $state();
	let html: string = $state('');
	let unsavedChanges = $state(false);
	let activeTab = $state('edit');
	let content = $state(post?.content || '');

	function adjustHeight(textarea: HTMLTextAreaElement) {
		resetHeight();
		textarea.oninput = resetHeight;

		function resetHeight() {
			textarea.style.height = '';
			textarea.style.height = textarea.scrollHeight + 2 + 'px';
		}
	}

	onMount(async () => {
		console.log({ post });
		let monaco = (await import('$lib/monaco-front')).default;
		editor = monaco.editor.create(editorContainer!, {
			value: content,
			language: 'markdown',
			wordWrap: 'on',
			scrollBeyondLastLine: false,
			minimap: {
				enabled: false
			},
			insertSpaces: true,
			tabSize: 2
		});
		const model = monaco.editor.createModel(content, 'markdown');
		model.onDidChangeContent(() => {
			content = model.getValue();
			unsavedChanges = true;
		});
		editor.setModel(model);
	});

	onDestroy(() => {
		editor?.getModel()?.dispose();
		editor?.dispose();
	});

	$effect(() => {
		if (activeTab === 'spellcheck') {
			editor?.getModel()?.setValue(content);
		}
	});

	function onCodeBlockButtonClick(language: string) {
		return (event: MouseEvent) => {
			event.preventDefault();
			if (!editor) return;
			addCodeBlock(editor, language);
		};
	}

	function onCutCommentButtonClick(mode: 'before' | 'after') {
		return (event: MouseEvent) => {
			event.preventDefault();
			if (!editor) return;
			addCutComment(editor, mode);
		};
	}
</script>

<form method="post">
	<LinkButton
		href="/admin"
		onclick={(e) => {
			if (unsavedChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
				e.preventDefault();
			}
		}}>←</LinkButton
	>
	<h1>{post ? 'Edit' : 'New'} post</h1>
	<div class="container">
		<div>
			<input type="text" placeholder="Titre" name="title" required value={post ? post.title : ''} />
		</div>
		<div>
			<input type="text" name="chapo" placeholder="Chapo" value={post ? post.chapo : ''} />
		</div>
		<details>
			<summary>Options</summary>
			<div>
				<label>
					<input type="checkbox" name="published" checked={post ? post.published : true} />
					Published
				</label>
			</div>
			<div>
				<label>
					<input
						type="datetime-local"
						name="createdAt"
						value={post
							? post.createdAt.toISOString().split('.')[0].split(':').slice(0, 2).join(':')
							: null}
					/>
				</label>
			</div>
		</details>
		<div>
			<div class="tabs">
				<button
					class="tab"
					class:active={activeTab === 'edit'}
					onclick={(e) => {
						e.preventDefault();
						activeTab = 'edit';
					}}>Edit</button
				>
				<button
					class="tab"
					class:active={activeTab === 'preview'}
					onclick={async (e) => {
						e.preventDefault();
						const response = await fetch('/render', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({ markdown: content })
						});
						const data = await response.json();
						html = data.html;
						activeTab = 'preview';
					}}
				>
					Preview
				</button>
				<button
					class="tab"
					class:active={activeTab === 'spellcheck'}
					onclick={(e) => {
						e.preventDefault();
						activeTab = 'spellcheck';
						(document.querySelector('textarea[name=content]') as HTMLTextAreaElement)?.focus();
					}}>Spell check</button
				>
			</div>
			<div class="preview" class:hidden={activeTab !== 'preview'}>
				<PostBody {html} />
			</div>
			<div class="editor-wrapper" class:hidden={activeTab !== 'edit'}>
				<div class="toolbar">
					<button onclick={onCodeBlockButtonClick('js')}>js</button>
					<button onclick={onCodeBlockButtonClick('ts twoslash')}>ts twoslash</button>
					<button onclick={onCutCommentButtonClick('before')}>cut before</button>
					<button onclick={onCutCommentButtonClick('after')}>cut after</button>
				</div>
				<div class="editor" bind:this={editorContainer}></div>
			</div>
			<div class="spellcheck" class:hidden={activeTab !== 'spellcheck'}>
				<textarea name="content" bind:value={content}></textarea>
			</div>
		</div>
		<button type="submit">{post ? 'Update' : 'Create'}</button>
	</div>
</form>

<style>
	h1 {
		margin-top: 0;
		margin-left: 1rem;
		display: inline-block;
	}
	.editor-wrapper {
		width: 100%;
		border: 1px solid #ccc;
		border-radius: 0px;
	}

	.toolbar {
		background-color: white;
		display: flex;
		gap: 1rem;
		padding: 0.5rem;
		/* border-bottom: 1px solid #ccc; */
	}

	.editor {
		width: 100%;
		height: 550px;
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

	input[type='text'],
	textarea {
		border: 1px solid #ccc;
		border-radius: 0px;
		padding: 0.5rem 1rem;
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
	.spellcheck textarea {
		height: 550px;
	}
	button[type='submit'] {
		padding: 1rem;
		background: var(--color-text);
		color: var(--color-background);
		border: none;
		cursor: pointer;
	}

	details {
		border: 1px solid #ccc;
		padding: 0.5rem 1rem;
		user-select: none;
	}
	details div {
		margin-top: 1rem;
	}
	summary {
		border-radius: 0px;
		cursor: pointer;
		font-weight: bold;
	}
</style>
