<script lang="ts">
	import PostForm from '$components/PostForm.svelte';

	let { data } = $props();
	let post = $derived(data.post);
</script>

<PostForm {post} />
