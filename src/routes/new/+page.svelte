<script lang="ts">
	import PostBody from './../../components/PostBody.svelte';
	// import ToggleButton from "../../components/ToggleButton.svelte";

	let showPreview = false;
	let content = "```js\nconst test = 'toto';\n```";
</script>

<form method="post">
	<h1>New Page</h1>
	<div class="New">
		<div>
			<input type="text" placeholder="Titre" name="title" required />
		</div>
		<div>
			<!-- <ToggleButton bind:isChecked={showPreview} /> -->
			<div class="tabs">
				<button
					class="tab"
					class:active={!showPreview}
					on:click|preventDefault={() => (showPreview = false)}>Edit</button
				>
				<button
					class="tab"
					class:active={showPreview}
					on:click|preventDefault={() => (showPreview = true)}>Preview</button
				>
			</div>
			{#if showPreview}
				<div class="preview">
					<PostBody markdown={content} />
				</div>
			{:else}
				<textarea name="content" bind:value={content} />
			{/if}
		</div>
		<button type="submit">Create</button>
	</div>
</form>

<style>
	.New {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
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
		padding: 1rem;
		width: 100%;
		box-sizing: border-box;
	}
	textarea {
		height: 10rem;
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
