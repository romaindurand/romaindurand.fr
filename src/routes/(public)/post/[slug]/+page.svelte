<script lang="ts">
	import PostBody from '$components/PostBody.svelte';

	export let data;
	$: post = data.post;
</script>

<div class="content">
	<h1>{post.title}</h1>
	<p class="chapo">{post.chapo}</p>
	<PostBody markdown={post.content} />
</div>

<style>
	.content {
		padding: 1rem;
	}

	.chapo {
		font-size: 1.2rem;
		font-style: italic;
		font-family:
			-apple-system,
			BlinkMacSystemFont,
			Segoe UI,
			Helvetica,
			Arial,
			sans-serif,
			Apple Color Emoji,
			Segoe UI Emoji;
	}
</style>
