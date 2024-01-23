<script lang="ts">
	import { Youtube } from 'svelte-youtube-lite';
	import { onMount } from 'svelte';
	import { getSlug } from '$lib';
	import Filter from '$components/Filter.svelte';

	export let data;

	$: posts = data.posts;

	let filters = [
		{ name: 'category1', active: true },
		{ name: 'category2', active: true },
		{ name: 'category3', active: true }
	];

	onMount(() => {
		const storedFilters = localStorage.getItem('filters');
		// TODO: if stored filters names doesn't match with filters names, reset stored filters

		if (storedFilters) {
			filters = JSON.parse(storedFilters);
		}
	});
</script>

{#each filters as { name, active }, i (i)}
	<Filter
		{name}
		{active}
		on:click={() => {
			filters[i].active = !filters[i].active;
			localStorage.setItem('filters', JSON.stringify(filters));
		}}
	/>
{/each}

{#each posts as post}
	<div class="post">
		<a href="post/{getSlug(post)}">
			<span class="title" style={`view-transition-name: post-title-${post.id};`}>{post.title}</span>
			<p style={`view-transition-name: post-chapo-${post.id};`}>{post.chapo}</p>
		</a>
	</div>
{/each}

<style>
	.post {
		margin: 2rem 0;
	}
	.post a {
		box-sizing: border-box;
		padding: 1rem;
		display: block;
		text-decoration: none;
		color: inherit;
		border: 4px solid transparent;
		transition: all 0.3s ease;
		border-radius: 20px;
	}
	.post a:hover {
		border: 4px solid red;
		border-radius: 0;
	}
	.post a:hover .title {
		text-decoration: underline;
	}

	.post .title {
		text-decoration: underline transparent;
		transition: text-decoration 0.3s ease;
		font-size: 1.5rem;
		font-weight: bold;
	}
</style>
