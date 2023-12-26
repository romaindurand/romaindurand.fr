<script>
	import { onMount } from 'svelte';

	onMount(() => {
		document.documentElement.setAttribute('data-theme', 'light');
	});
</script>

<div class="Layout">
	<slot />
</div>

<style>
	.Layout {
		padding: 1rem;
	}
</style>
