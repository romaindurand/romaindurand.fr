<script lang="ts">
	import { run } from 'svelte/legacy';

	import { matchesComponent, parseTag, splitOnComponent } from '#lib/markdown.js';
	import './PostBody.css';
	import '@shikijs/twoslash/style-classic.css';

	import { Youtube } from 'svelte-youtube-lite';
	import { targetBlankLinks } from '#lib';
	import TwoslashError from './TwoslashError.svelte';

	interface Props {
		html?: string;
	}

	let { html = '' }: Props = $props();

	let splitHtml: string[] = $state([]);
	const components = { Youtube, TwoslashError };
	const componentNames = Object.keys(components);

	async function onClick(event: MouseEvent) {
		const button = (event.target as Element).closest<HTMLButtonElement>('[data-copy]');
		if (!button) return;
		const lines = button.closest('.codeblock')?.querySelectorAll('pre .line');
		const text = Array.from(lines ?? [], (line) => line.textContent ?? '').join('\n');
		try {
			await navigator.clipboard.writeText(text);
			button.textContent = 'COPIÉ';
		} catch {
			button.textContent = 'ERREUR';
		}
		setTimeout(() => (button.textContent = 'COPIER'), 1600);
	}

	run(() => {
		splitHtml = splitOnComponent(html, componentNames);
		targetBlankLinks();
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="PostBody" onclick={onClick}>
	{#each splitHtml as line, index (index)}
		{#if matchesComponent(line, componentNames)}
			{@const { name, attributes } = parseTag(line)}
			{#if name === 'Youtube'}
				<Youtube {...attributes ?? {}} />
			{:else if name === 'TwoslashError'}
				<TwoslashError
					title={attributes?.title ?? ''}
					recommendation={attributes?.recommendation ?? ''}
					description={attributes?.description ?? ''}
				/>
			{/if}
		{:else}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
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

	.PostBody :global(pre .inline-completions ul.dropdown::before) {
		top: initial;
		left: initial;
		transform: translate(-3px, -22px);
	}

	.PostBody :global(pre .inline-completions ul.dropdown) {
		position: relative;
		font-size: 1rem;
	}
</style>
