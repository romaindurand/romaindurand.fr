<script lang="ts">
	import '@fontsource/atkinson-hyperlegible';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import '../../global.css';
	import type { LayoutData } from './$types';
	interface Props {
		children?: import('svelte').Snippet;
		data: LayoutData;
	}

	let { children, data }: Props = $props();

	let theme: string;

	onMount(() => {
		theme = document.documentElement.getAttribute('data-theme') as string;
	});

	onNavigate((navigation) => {
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
		{ url: '', name: 'BLOG' },
		{ url: 'projects', name: 'PROJETS' },
		{ url: 'contact', name: 'CONTACT' },
		{ url: 'about', name: 'À PROPOS' }
	];
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
<header>
	<span>Romain Durand</span>
	<span>
		{#if data.isAdmin}
			<a href="/admin" class="admin-link">Admin</a>
		{/if}
		<button aria-label="changer le thème" onclick={toggleTheme} class="toggle-theme"></button>
	</span>
</header>
<nav>
	<ul>
		{#each pages as { url: path, name }}
			<li class:active={$page.url.pathname.replace(/\//g, '') === path}>
				<a href={`/${path}`}>
					{name}
				</a>
			</li>
		{/each}
	</ul>
</nav>
<div class="Layout">
	{@render children?.()}
</div>

<style>
	.Layout {
		padding: 1rem;
		max-width: 720px;
		margin: 0 auto;
		border-left-style: solid;
		border-right-style: solid;
		border-color: var(--color-text);
		border-width: 4px;
		min-height: 100vh;
		transition: all 0.3s ease;
	}

	nav {
		view-transition-name: site-nav;
		font-family: var(--code-font);
		& ul {
			border: 4px solid var(--color-text);
			border-top: none;
			margin: auto;
			width: 100%;
			box-sizing: border-box;
			max-width: calc(720px + 2rem + 8px);
			display: flex;
			justify-content: space-between;
			transition: all 0.3s ease;
		}
	}

	header {
		font-family: var(--code-font);
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		view-transition-name: site-title;
		color: var(--color-background);
		background-color: var(--color-text);
		margin: 0;
		padding: 0.5rem;
		border-bottom: none;
		font-size: 1.1rem;
		font-weight: normal;
		transition: all 0.3s ease;
	}
	header span {
		position: relative;
		display: flex;
		gap: 1rem;
	}
	header .toggle-theme {
		z-index: 10;
		right: 0.5rem;
		border: 1px solid var(--color-grey);
		cursor: pointer;
		height: 1.1rem;
		width: 1.1rem;
		border-radius: 50%;
		background-color: var(--color-background);
		transition: all 0.3s ease;
	}

	header .toggle-theme:hover {
		transform: scale(1.5);
	}

	ul {
		display: flex;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	nav li {
		font-weight: bold;
		font-size: 2rem;
		box-sizing: border-box;
	}

	nav a {
		display: block;
		padding: 1rem;
		text-decoration: none;
		color: var(--color-text);
		transition:
			color 0.3s ease,
			background-color 0.3s ease;
	}

	nav li.active a {
		color: var(--color-red-on-text);
		background-color: var(--color-text);
	}

	nav li:hover:not(.active) a,
	nav li.active {
		color: var(--color-red-on-bg);
	}

	@media (max-width: 520px) {
		nav {
			border-bottom: none;
		}
		nav ul {
			margin: 0;
			width: 100%;
			flex-direction: column;
			border-bottom: none;
		}
		nav li a {
			font-size: 1.5rem;
			padding: 0.5rem;
			display: block;
			border-bottom: 4px solid var(--color-text);
			text-align: center;
		}

		nav li {
			border-right: none;
		}
	}
</style>
