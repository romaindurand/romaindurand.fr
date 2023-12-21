<script lang="ts">
	import PostForm from '$components/PostForm.svelte';

	export let data;
	$: post = data.post;
</script>

<PostForm {post} />
