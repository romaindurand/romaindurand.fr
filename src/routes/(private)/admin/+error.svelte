<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		if ($page.status === 401) {
			window.setTimeout(() => {
				window.location.href = '/admin/login';
			}, 1000);
		}
	});
</script>

<div class="Layout">
	<h1>{$page.status}</h1>
	<h2>{$page?.error?.message}</h2>
	{@render children?.()}
</div>

<style>
	.Layout {
		padding: 1rem;
	}
</style>
