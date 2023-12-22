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
	nav {
		display: flex;
		border: 4px solid black;
		border-right: none;
		justify-content: space-between;
	}

	h1 {
		color: white;
		background-color: black;
		margin: 0;
		padding: 0.5rem;
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
		transition: all 0.3s ease;
	}

	nav a:hover,
	nav a.active {
		background-color: black;
		color: white;
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
			border-bottom: 4px solid black;
			width: 100%;
			text-align: center;
		}
	}
</style>
