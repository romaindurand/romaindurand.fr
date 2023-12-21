<script lang="ts">
	import { page } from '$app/stores';

	const pages = ['', 'about', 'projects', 'contact'];
</script>

<h1>Romain Durand</h1>
<nav>
	<ul>
		{#each pages as path}
			<li>
				<a href={`/${path}`} class:active={$page.url.pathname === `/${path}`}>
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
	/* .Layout {
		padding: 1rem;
	} */

	nav {
		display: flex;
		border: 4px solid black;
		justify-content: space-between;
	}

	h1 {
		color: white;
		background-color: black;
		margin: 0;
		padding: 0.5rem;
		/* border: 4px solid black; */
		border-bottom: none;
		font-size: 1.1rem;
		font-weight: normal;
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
		border-right: 4px solid black;
		box-sizing: border-box;
		padding: 1rem;
		text-decoration: none;
		color: black;
		transition: all 0.2s ease;
	}

	nav a:hover,
	nav a.active {
		background-color: black;
		color: white;
	}
</style>
