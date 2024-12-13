<script lang="ts">
	import '../../../global.css';
	import { onMount, type Snippet } from 'svelte';
	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		document.documentElement.setAttribute('data-theme', 'light');
	});
</script>

<div class="Layout">
	{@render children?.()}
</div>

<style>
	.Layout {
		padding: 1rem;
	}
</style>
