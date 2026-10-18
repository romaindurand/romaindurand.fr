<script lang="ts">
	import { describeSelection, type PostStatus, type TagFilter } from '#lib/tag-filter.js';

	interface Props {
		tags: { name: string; count: number }[];
		filter: TagFilter;
		total: number;
		resetHref: string;
		status?: PostStatus;
		showStatus?: boolean;
	}

	let { tags, filter, total, resetHref, status = 'all', showStatus = false }: Props = $props();

	let form: HTMLFormElement | undefined = $state();
	const parts = $derived(describeSelection(filter, status, total));
	const needsChoice = $derived(filter.tags.length > 1);
	const dirty = $derived(filter.tags.length > 0 || status !== 'all');
	const STATUSES = [
		['all', 'Tous'],
		['draft', 'Brouillons'],
		['published', 'Publiés']
	] as const;

	// formulaire GET natif : sans JavaScript, le bouton « Appliquer » suffit
	const submit = () => form?.requestSubmit();
</script>

<form
	bind:this={form}
	method="get"
	data-sveltekit-keepfocus
	data-sveltekit-noscroll
	aria-label="Filtrer les articles"
>
	{#if tags.length}
		<fieldset class="tags">
			<legend>Filtrer par tags</legend>
			{#each tags as tag (tag.name)}
				<label class="chip">
					<input
						type="checkbox"
						name="tags"
						value={tag.name}
						checked={filter.tags.includes(tag.name)}
						onchange={submit}
					/>
					<span>{tag.name} <small>{tag.count}</small></span>
				</label>
			{/each}
		</fieldset>
	{/if}
	<fieldset class="mode" class:muted={!needsChoice}>
		<legend>Mode de combinaison</legend>
		<label>
			<input
				type="radio"
				name="mode"
				value="all"
				checked={filter.mode === 'all'}
				onchange={submit}
			/>
			Tous ces tags (ET)
		</label>
		<label>
			<input
				type="radio"
				name="mode"
				value="any"
				checked={filter.mode === 'any'}
				onchange={submit}
			/>
			Au moins un de ces tags (OU)
		</label>
		{#if !needsChoice}<span class="hint">sans effet avec un seul tag</span>{/if}
	</fieldset>
	{#if showStatus}
		<fieldset class="status">
			<legend>Statut</legend>
			{#each STATUSES as [value, label] (value)}
				<label>
					<input type="radio" name="status" {value} checked={status === value} onchange={submit} />
					{label}
				</label>
			{/each}
		</fieldset>
	{/if}
	<p class="result" aria-live="polite">
		{#each parts as part, index (index)}{#if part.strong}<strong>{part.text}</strong
				>{:else}{part.text}{/if}{/each}
	</p>
	<noscript><button type="submit">Appliquer</button></noscript>
	{#if dirty}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="reset" href={resetHref}>Réinitialiser</a>
	{/if}
</form>

<style>
	form {
		display: grid;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1.25rem;
		border: 2px solid var(--color-text);
	}
	fieldset {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		margin-bottom: 0.5rem;
		padding: 0;
		font-family: var(--code-font);
		font-size: 0.8125rem;
		font-weight: 700;
	}
	.chip {
		position: relative;
		display: inline-flex;
	}
	.chip input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.chip span {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0 0.875rem;
		border: 2px solid var(--color-text);
		font-family: var(--code-font);
		font-size: 0.875rem;
		font-weight: 700;
	}
	.chip small {
		font-weight: 400;
	}
	.chip input:checked + span {
		background: var(--color-text);
		color: var(--color-background);
	}
	.chip input:focus-visible + span {
		outline: 4px solid var(--color-red-on-bg);
		outline-offset: 2px;
	}
	.mode label,
	.status label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		cursor: pointer;
	}
	.muted label,
	.hint {
		color: var(--color-grey-on-bg);
	}
	.hint {
		font-size: 0.8125rem;
	}
	.result {
		margin: 0;
		font-family: var(--code-font);
	}
	.reset {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		justify-self: start;
		color: var(--color-text);
	}
</style>
