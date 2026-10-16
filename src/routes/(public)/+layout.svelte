<script lang="ts">
	import '@fontsource/atkinson-hyperlegible';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import '../../global.css';
	import { getActiveIndex, navItems } from '#lib/nav.js';
	import type { LayoutData } from './$types';

	interface Props {
		children?: import('svelte').Snippet;
		data: LayoutData;
	}

	let { children, data }: Props = $props();
	let theme = $state('dark');
	const active = $derived(getActiveIndex(page.url.pathname));

	onMount(() => {
		theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
	});

	onNavigate((navigation) => {
		if (navigation.shallow && navigation.type === 'goto') return;
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}

	const pages = [
		{ href: '/(public)', name: 'BLOG' },
		{ href: '/(public)/projects', name: 'PROJETS' },
		{ href: '/(public)/contact', name: 'CONTACT' },
		{ href: '/(public)/about', name: 'À PROPOS' }
	] as const;
</script>

<svelte:head>
	<meta name="description" content="Romain Durand, développeur web fullstack" />

	<meta
		name="keywords"
		content="Romain Durand, typescript, svelte, javascript, sveltekit, web, fullstack, developer, développeur, blog"
	/>
	<meta name="author" content="Romain Durand" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#000000" />
</svelte:head>
<header id="top">
	<div class="wrap bar">
		<a href={resolve('/(public)')} class="prompt">
			<span class="dollar" aria-hidden="true">$</span>romain-durand<span class="path"
				>{navItems[active].path}</span
			><span class="cursor" aria-hidden="true"></span>
		</a>
		<span class="tools">
			{#if data.isAdmin}
				<a href={resolve('/(private)/admin')} class="admin-link">Admin</a>
			{/if}
			<button
				type="button"
				class="theme-btn"
				aria-label="Changer le thème"
				aria-pressed={theme === 'dark'}
				onclick={toggleTheme}
			>
				<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" />
					<path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
				</svg>
			</button>
		</span>
	</div>
	<nav aria-label="Navigation principale" style:--i={active}>
		<div class="wrap-nav">
			{#each pages as { href, name }, i (name)}
				<a href={resolve(href)} aria-current={i === active ? 'page' : undefined}>{name}</a>
			{/each}
			<span class="indicator" aria-hidden="true"></span>
		</div>
	</nav>
</header>
<div class="wrap">
	<main>{@render children?.()}</main>
	<footer>
		<span>romaindurand.fr</span>
		<a href="#top">↑ haut de page</a>
	</footer>
</div>

<style>
	.wrap {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 2rem;
	}
	header {
		view-transition-name: site-title;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 0.75rem;
	}
	.prompt {
		display: inline-flex;
		align-items: center;
		min-width: 0;
		min-height: 44px;
		white-space: nowrap;
		font-family: var(--code-font);
		font-weight: 700;
		font-size: clamp(0.875rem, 4.6vw, 1.125rem);
		color: var(--color-text);
		text-decoration: none;
	}
	.dollar {
		color: var(--color-red-on-bg);
		margin-right: 0.625rem;
	}
	.path {
		color: var(--color-grey-on-bg);
		margin-left: 0.625rem;
	}
	.cursor {
		display: inline-block;
		width: 0.55em;
		height: 1.1em;
		background: var(--color-red-on-bg);
		margin-left: 6px;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.admin-link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-family: var(--code-font);
		color: var(--color-text);
	}
	.theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		background: transparent;
		color: var(--color-text);
		border: 2px solid var(--color-text);
		cursor: pointer;
	}
	.theme-btn:hover,
	.theme-btn:focus-visible {
		background: var(--color-text);
		color: var(--color-background);
	}
	nav {
		view-transition-name: site-nav;
		border-block: 2px solid var(--color-text);
	}
	.wrap-nav {
		position: relative;
		max-width: 1000px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.wrap-nav a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 56px;
		font-family: var(--code-font);
		font-weight: 700;
		font-size: clamp(0.875rem, 4.2vw, 1.375rem);
		letter-spacing: 0.03em;
		color: var(--color-text);
		text-decoration: none;
	}
	.wrap-nav a:hover,
	.wrap-nav a:focus-visible {
		color: var(--color-red-on-bg);
	}
	.indicator {
		position: absolute;
		left: 0;
		bottom: -2px;
		height: 6px;
		width: 25%;
		background: var(--color-red-on-bg);
		transform: translateX(calc(var(--i) * 100%));
	}
	@media (prefers-reduced-motion: no-preference) {
		.cursor {
			animation: blink 1.1s steps(1) infinite;
		}
		.indicator {
			transition: transform 0.38s cubic-bezier(0.65, 0, 0.25, 1);
		}
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	@media (max-width: 520px) {
		.wrap {
			padding: 0 1rem;
		}
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 3rem 0 3.5rem;
		font-family: var(--code-font);
		font-size: 0.875rem;
	}
	footer span {
		color: var(--color-grey-on-bg);
	}
	footer a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-weight: 700;
		color: var(--color-text);
	}
	footer a:hover {
		color: var(--color-red-on-bg);
	}
</style>
