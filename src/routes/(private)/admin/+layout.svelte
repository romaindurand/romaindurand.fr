<script lang="ts">
	import '../../../global.css';
	import { onMount, type Snippet } from 'svelte';
	import { resolve } from '$app/paths';

	interface Props {
		children?: Snippet;
		data: { igStatus: string | null };
	}

	let { children, data }: Props = $props();

	onMount(() => {
		document.documentElement.setAttribute('data-theme', 'light');
	});
</script>

{#if data.igStatus && data.igStatus !== 'ok'}
	<div role="alert">
		<a class="banner" href={resolve('/(private)/admin/instagram')}>
			Session Instagram {data.igStatus === 'expired' ? 'expirée' : 'absente'} : renouveler
		</a>
	</div>
{/if}
<div class="Layout">
	{@render children?.()}
</div>

<style>
	.Layout {
		padding: 1rem 1.5rem;
		overflow-x: hidden;
	}
	.banner {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0.5rem 1rem;
		background: #b60000;
		color: #fff;
		font-weight: 700;
		text-decoration: none;
	}
	.banner:hover,
	.banner:focus-visible {
		text-decoration: underline;
	}
</style>
