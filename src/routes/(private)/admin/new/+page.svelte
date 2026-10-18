<script lang="ts">
	import PostForm from '#components/PostForm.svelte';

	let { data } = $props();
</script>

<PostForm allTags={data.allTags} />
