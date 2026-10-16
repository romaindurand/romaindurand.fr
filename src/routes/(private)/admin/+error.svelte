<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	onMount(() => {
		if (page.status === 401) {
			window.setTimeout(() => {
				window.location.href = '/admin/login';
			}, 1000);
		}
	});
</script>

<div class="Layout">
	<h1>{page.status}</h1>
	<h2>{page?.error?.message}</h2>
</div>

<style>
	.Layout {
		padding: 1rem;
	}
</style>
