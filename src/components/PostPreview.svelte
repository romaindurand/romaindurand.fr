<script lang="ts">
	import PostBody from '$components/PostBody.svelte';
	import { converter } from '$lib/showdown';
	// imports showdown client-side, to allow for live preview without api calls

	export let markdown: string = '';
	$: html = converter.makeHtml(markdown);
</script>

<PostBody {html} />
