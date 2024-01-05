<script lang="ts">
	import PostBody from '$components/PostBody.svelte';

	export let data;
	$: post = data.post;
</script>

<div class="content">
	<h1 style={`view-transition-name: post-title-${post.id};`}>{post.title}</h1>
	<p class="chapo" style={`view-transition-name: post-chapo-${post.id};`}>{post.chapo}</p>
	<PostBody content={post.html} />
</div>

<style>
	h1 {
		display: inline;
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
