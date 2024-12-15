<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		href: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	};
	let { href, onclick, children }: Props = $props();
</script>

<a class="LinkButton" {href} {onclick}>{@render children()}</a>

<style>
	.LinkButton {
		transform: translate(0, -0.3rem);
		display: inline-block;
		padding: 0.5rem 1rem;
		border: 1px solid black;
		border-radius: 0.5rem;
		text-decoration: none;
		color: #000;
	}
</style>
