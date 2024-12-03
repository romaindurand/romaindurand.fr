<script lang="ts">
	import { createBubbler } from 'svelte/legacy';

	const bubble = createBubbler();
	interface Props {
		active: boolean;
		name: string;
	}

	let { active, name }: Props = $props();
</script>

<button class="Filter" class:active onclick={bubble('click')}>
	#{name}
</button>

<style>
	.Filter {
		font-family: var(--font-family);
		font-size: 1rem;
		text-transform: uppercase;
		padding: 0.5rem 1rem;
		cursor: pointer;
		margin: 0.5rem;
		color: var(--color-text);
		border: 2px solid var(--color-text);
		background-color: var(--color-background);
		transition: all 0.5s ease;
	}
	.Filter:hover {
		color: red;
	}
	.active {
		background-color: var(--color-text);
		color: red;
	}

	.active:hover {
		color: var(--color-background);
	}
</style>
