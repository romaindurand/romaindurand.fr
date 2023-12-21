<script lang="ts">
	import type { Post } from '@prisma/client';
	import PostBody from './PostBody.svelte';

	export let post: Post | null = null;

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
				<PostBody markdown={content} />
			</div>
			<textarea name="content" bind:value={content} class:hidden={showPreview} use:adjustHeight />
		</div>
		<button type="submit">{post ? 'Update' : 'Create'}</button>
	</div>
</form>

<style>
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
		outline: 2px solid black;
		border-radius: 0px;
	}

	textarea {
		height: 1rem;
		resize: vertical;
	}
	button[type='submit'] {
		padding: 1rem;
		background: #000;
		color: #fff;
		border: none;
		cursor: pointer;
	}
</style>
