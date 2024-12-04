<script lang="ts">
	import { onMount } from 'svelte';
	import { getSlug } from '$lib';
	import { formatDate } from 'date-fns';
	import { fr } from 'date-fns/locale';
	// import Filter from '$components/Filter.svelte';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let posts = $derived(data.posts);

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

<!-- {#each filters as { name, active }, i (i)}
	<Filter
		{name}
		{active}
		on:click={() => {
			filters[i].active = !filters[i].active;
			localStorage.setItem('filters', JSON.stringify(filters));
		}}
	/>
{/each} -->

{#each posts as post}
	<div class="post">
		<a href="post/{getSlug(post)}">
			<span class="title" style={`view-transition-name: post-title-${post.id};`}>{post.title}</span>
			<div class="date" style={`view-transition-name: post-date-${post.id};`}>
				Le {formatDate(post.createdAt, 'dd MMMM yyyy à HH:mm', {
					locale: fr
				})}
			</div>
			<p class="chapo" style={`view-transition-name: post-chapo-${post.id};`}>{post.chapo}</p>
		</a>
	</div>
{/each}

<style>
	.post {
		margin: 2rem 0;
	}
	.post a {
		font-size: 1.1rem;
		box-sizing: border-box;
		padding: 1rem;
		display: block;
		text-decoration: none;
		color: inherit;
		border: 4px solid transparent;
		transition: all 0.3s ease;
	}
	.post a:hover {
		border: 4px solid red;
	}
	.post a:hover .title {
		text-decoration: underline;
	}

	.post .title {
		text-decoration: underline transparent;
		transition: text-decoration 0.3s ease;
		font-size: 1.6rem;
		font-weight: bold;
	}

	.post .date {
		margin: 0.5rem 0;
		color: var(--color-grey-on-bg);
		font-family: var(--code-font);
	}
	.post .chapo {
		font-size: 1.2rem;
		margin-top: 0.5rem;
	}
</style>
