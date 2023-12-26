<script lang="ts">
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

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

	const pages = ['', 'about', 'projects', 'contact'];
</script>

<h1>
	<span>Romain Durand</span>
	<button on:click={toggleTheme} class="toggle-theme"></button>
</h1>
<nav>
	<ul>
		{#each pages as path}
			<li>
				<a href={`/${path}`} class:active={$page.url.pathname.replace(/\//g, '') === path}>
					{path || 'Blog'}
				</a>
			</li>
		{/each}
	</ul>
</nav>
<div class="Layout">
	<slot />
</div>

<style>
	nav {
		view-transition-name: site-nav;
		display: flex;
		border: 4px solid var(--color-text);
		border-right: none;
		justify-content: space-between;
	}

	h1 {
		display: flex;
		justify-content: space-between;
		view-transition-name: site-title;
		color: var(--color-background);
		background-color: var(--color-text);
		margin: 0;
		padding: 0.5rem;
		border-bottom: none;
		font-size: 1.1rem;
		font-weight: normal;
	}
	h1 .toggle-theme {
		z-index: 10;
		position: absolute;
		right: 0.5rem;
		display: block;
		border: 1px solid var(--color-grey);
		cursor: pointer;
		height: 1.1rem;
		width: 1.1rem;
		border-radius: 50%;
		background-color: var(--color-background);
		transition: all 0.3s ease;
	}

	h1 .toggle-theme:hover {
		transform: scale(1.5);
	}

	ul {
		display: flex;
		list-style: none;
		padding: 0;
	}

	nav a {
		text-transform: capitalize;
		font-weight: bold;
		font-size: 2rem;
		border-right: 4px solid var(--color-text);
		box-sizing: border-box;
		padding: 1rem;
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.3s ease;
	}

	nav a:hover,
	nav a.active {
		background-color: var(--color-text);
		color: var(--color-background);
	}

	@media (max-width: 500px) {
		nav {
			border: none;
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
			border-right: none;
			border-bottom: 4px solid var(--color-text);
			width: 100%;
			text-align: center;
		}
	}
</style>
