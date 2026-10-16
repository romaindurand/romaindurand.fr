<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSlug } from '#lib';
	import { formatPostDate } from '#lib/date.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let posts = $derived(data.posts);
</script>

<svelte:head>
	<title>Romain Durand</title>
</svelte:head>

<h1 class="sr-only">Journal de Romain Durand</h1>

<section aria-label="Articles">
	{#each posts as post (post.id)}
		{@const { day, time } = formatPostDate(post.createdAt)}
		<a class="entry" href={resolve('/(public)/post/[slug]', { slug: getSlug(post) })}>
			<span class="meta" style={`view-transition-name: post-date-${post.id};`}
				>{day}<br />{time}</span
			>
			<span class="body">
				<span class="title" style={`view-transition-name: post-title-${post.id};`}
					>{post.title}</span
				>
				<span class="chapo" style={`view-transition-name: post-chapo-${post.id};`}
					>{post.chapo}</span
				>
			</span>
		</a>
	{/each}
</section>

<style>
	section {
		padding-top: 2.5rem;
		border-bottom: 2px solid var(--color-text);
	}
	.entry {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 2.5rem;
		padding: 2.25rem 0;
		border-top: 2px solid var(--color-text);
		color: var(--color-text);
		text-decoration: none;
	}
	.meta {
		flex: 0 0 150px;
		font-family: var(--code-font);
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--color-grey-on-bg);
	}
	.body {
		flex: 1 1 380px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.title {
		font-family: var(--code-font);
		font-weight: 700;
		font-size: clamp(1.25rem, 2.4vw, 1.75rem);
		line-height: 1.25;
		text-wrap: balance;
	}
	.entry:hover .title,
	.entry:focus-visible .title {
		color: var(--color-red-on-bg);
		text-decoration: underline;
		text-decoration-thickness: 3px;
		text-underline-offset: 6px;
	}
	.chapo {
		font-size: 1.125rem;
		line-height: 1.55;
		color: var(--color-grey-on-bg);
	}
</style>
