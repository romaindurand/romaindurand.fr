<script lang="ts">
	import { matchesComponent, parseTag, splitOnComponent } from '$lib/markdown';
	import './PostBody.css';

	import { Youtube } from 'svelte-youtube-lite';
	import { targetBlankLinks } from '$lib';
	import type { ComponentType, SvelteComponent } from 'svelte';

	export let html: string = '';

	let splitHtml: string[] = [];
	const components: Record<string, ComponentType<SvelteComponent>> = { Youtube };
	const componentNames = Object.keys(components);

	$: {
		splitHtml = splitOnComponent(html, componentNames);
		console.log({ splitHtml });
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
