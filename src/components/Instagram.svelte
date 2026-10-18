<script lang="ts">
	import { instagramEmbedUrl, instagramPostUrl, isInstagramCode } from '#lib/instagram-embed.js';

	let { code }: { code: string } = $props();

	// façade : aucune requête vers Instagram avant le clic ; le clic vaut pour ce code seulement
	// (si le code change, par exemple dans la prévisualisation, la façade revient)
	let loadedCode = $state('');
	let loaded = $derived(loadedCode === code);
</script>

{#if isInstagramCode(code)}
	<div class="IgEmbed">
		{#if loaded}
			<iframe
				src={instagramEmbedUrl(code)}
				title="Publication Instagram"
				loading="lazy"
				allowfullscreen
			></iframe>
		{:else}
			<button type="button" onclick={() => (loadedCode = code)}>
				Afficher la publication Instagram
			</button>
		{/if}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={instagramPostUrl(code)} target="_blank" rel="noopener noreferrer">Voir sur Instagram</a
		>
	</div>
{/if}

<style>
	.IgEmbed {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		margin: 1.5rem 0;
		padding: 1rem;
		border: 2px solid var(--color-text);
		background: var(--color-surface);
	}
	button {
		min-height: 44px;
		padding: 0 1rem;
		border: 2px solid var(--color-text);
		background: var(--color-red-on-bg);
		color: var(--color-on-accent);
		font-family: var(--code-font);
		font-weight: 700;
		cursor: pointer;
	}
	button:hover,
	button:focus-visible {
		background: var(--color-text);
		color: var(--color-background);
	}
	iframe {
		width: 100%;
		max-width: 540px;
		height: 760px;
		border: 0;
		background: #fff;
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-family: var(--code-font);
	}
</style>
