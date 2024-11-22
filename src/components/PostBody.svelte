<script lang="ts">
	import { matchesComponent, parseTag, splitOnComponent } from '$lib/markdown';
	import './PostBody.css';
	// import './shiki-twoslash.css';
	import '@shikijs/twoslash/style-classic.css';

	import { Youtube } from 'svelte-youtube-lite';
	import { targetBlankLinks } from '$lib';
	import type { ComponentType, SvelteComponent } from 'svelte';

	export let html: string = '';

	let splitHtml: string[] = [];
	const components: Record<string, ComponentType<SvelteComponent>> = { Youtube };
	const componentNames = Object.keys(components);

	$: {
		splitHtml = splitOnComponent(html, componentNames);
		targetBlankLinks();
	}
</script>

<div class="PostBody">
	{#each splitHtml as line}
		{#if matchesComponent(line, componentNames)}
			{@const { name, attributes } = parseTag(line)}
			<svelte:component this={components[name]} {...attributes} />
		{:else}
			{@html line}
		{/if}
	{/each}
</div>

<style>
	.PostBody :global(pre .error) {
		position: relative;
	}

	.PostBody :global(pre .error-behind) {
		content: 'Error:';
		display: none;
	}
</style>
