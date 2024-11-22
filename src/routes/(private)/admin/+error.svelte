<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="Layout">
	<h1>{$page.status}</h1>
	<h2>{$page?.error?.message}</h2>
	<slot />
</div>

<style>
	.Layout {
		padding: 1rem;
	}
</style>
