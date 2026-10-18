<script lang="ts">
	import { resolve } from '$app/paths';
	import PostMedia from '#components/PostMedia.svelte';
	import TagFilter from '#components/TagFilter.svelte';
	import { getSlug } from '#lib';
	import { formatPostDate } from '#lib/date.js';
	import { tagFilterQuery } from '#lib/tag-filter.js';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const home = resolve('/(public)');
	const pageHref = (page: number) => `${home}${tagFilterQuery(data.filter, { page })}`;
	const tagHref = (name: string) => `${home}${tagFilterQuery({ tags: [name], mode: 'all' })}`;
	const hasNext = $derived(data.page * data.pageSize < data.total);
</script>

<svelte:head>
	<title>Romain Durand</title>
</svelte:head>

<h1 class="sr-only">Journal de Romain Durand</h1>

<TagFilter tags={data.tagCounts} filter={data.filter} total={data.total} resetHref={home} />

<section aria-label="Articles">
	{#each data.posts as post (post.id)}
		{@const { day, time } = formatPostDate(post.createdAt)}
		<article class="entry">
			<div class="rail">
				<span class="meta" style={`view-transition-name: post-date-${post.id};`}
					>{day}<br />{time}</span
				>
				{#each post.tags as tag (tag.name)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="tag" href={tagHref(tag.name)}>{tag.name}</a>
				{/each}
			</div>
			<div class="body">
				<h2 class="title" style={`view-transition-name: post-title-${post.id};`}>
					<a class="elink" href={resolve('/(public)/post/[slug]', { slug: getSlug(post) })}
						>{post.title}</a
					>
				</h2>
				{#if post.media.length}
					<PostMedia media={post.media} title={post.title} />
				{/if}
				{#if post.chapo}
					<p class="chapo" style={`view-transition-name: post-chapo-${post.id};`}>{post.chapo}</p>
				{/if}
			</div>
		</article>
	{:else}
		<p class="empty">Aucun article ne correspond à ces filtres.</p>
	{/each}
</section>

{#if data.page > 1 || hasNext}
	<nav class="pager" aria-label="Pagination">
		{#if data.page > 1}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={pageHref(data.page - 1)}>← Plus récents</a>
		{/if}
		<span>Page {data.page}</span>
		{#if hasNext}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={pageHref(data.page + 1)}>Plus anciens →</a>
		{/if}
	</nav>
{/if}

<style>
	section {
		margin-top: 2.5rem;
		border-bottom: 2px solid var(--color-text);
	}
	.entry {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 2.5rem;
		padding: 2.25rem 0;
		border-top: 2px solid var(--color-text);
	}
	.rail {
		flex: 0 0 150px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.meta {
		font-family: var(--code-font);
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--color-grey-on-bg);
	}
	.tag {
		position: relative;
		padding: 1px 8px;
		border: 2px solid var(--color-text);
		font-family: var(--code-font);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--color-text);
		text-decoration: none;
	}
	/* zone de toucher agrandie sans grossir la puce */
	.tag::after {
		content: '';
		position: absolute;
		inset: -10px -4px;
	}
	.tag:hover,
	.tag:focus-visible {
		background: var(--color-text);
		color: var(--color-background);
	}
	.body {
		flex: 1 1 380px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.title {
		margin: 0;
		font-family: var(--code-font);
		font-weight: 700;
		font-size: clamp(1.25rem, 2.4vw, 1.75rem);
		line-height: 1.25;
		text-wrap: balance;
	}
	.elink {
		color: var(--color-text);
		text-decoration: none;
	}
	.entry:hover .elink,
	.elink:focus-visible {
		color: var(--color-red-on-bg);
		text-decoration: underline;
		text-decoration-thickness: 3px;
		text-underline-offset: 6px;
	}
	.chapo {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.55;
		color: var(--color-grey-on-bg);
	}
	.empty {
		padding: 2.25rem 0;
		border-top: 2px solid var(--color-text);
		font-family: var(--code-font);
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 1.5rem;
		font-family: var(--code-font);
	}
	.pager a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--color-text);
	}
</style>
