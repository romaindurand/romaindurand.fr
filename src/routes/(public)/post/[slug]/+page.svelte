<script lang="ts">
	import { resolve } from '$app/paths';
	import PostBody from '#components/PostBody.svelte';
	import { getSlug } from '#lib';
	import { formatPostDate } from '#lib/date.js';
	import { getMetaDescription } from '#lib/seo.js';

	let { data } = $props();
	let post = $derived(data.post);
	let { day, time } = $derived(formatPostDate(post.createdAt));
</script>

<svelte:head>
	<title>{post.title} - Romain Durand</title>
	<meta name="description" content={getMetaDescription(post)} />
</svelte:head>

<article>
	<div class="rail">
		<span class="meta" style={`view-transition-name: post-date-${post.id};`}>{day}<br />{time}</span
		>
	</div>
	<div class="prose">
		<header>
			<h1 style={`view-transition-name: post-title-${post.id};`}>{post.title}</h1>
			<p class="chapo" style={`view-transition-name: post-chapo-${post.id};`}>{post.chapo}</p>
		</header>
		<PostBody html={post.html} />
		<nav class="pager" aria-label="Articles voisins">
			{#if data.older}
				<a href={resolve('/(public)/post/[slug]', { slug: getSlug(data.older) })}>
					<span class="pmeta">← PLUS ANCIEN · {formatPostDate(data.older.createdAt).day}</span>
					<span class="ptitle">{data.older.title}</span>
				</a>
			{/if}
			{#if data.newer}
				<a class="next" href={resolve('/(public)/post/[slug]', { slug: getSlug(data.newer) })}>
					<span class="pmeta">PLUS RÉCENT · {formatPostDate(data.newer.createdAt).day} →</span>
					<span class="ptitle">{data.newer.title}</span>
				</a>
			{/if}
		</nav>
	</div>
</article>

<style>
	article {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem 2.5rem;
		padding-top: 3rem;
	}
	.rail {
		flex: 0 0 150px;
		align-self: flex-start;
		position: sticky;
		top: 1.5rem;
	}
	.meta {
		font-family: var(--code-font);
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--color-grey-on-bg);
	}
	.prose {
		flex: 1 1 380px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1.375rem;
	}
	header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	h1 {
		margin: 0;
		font-family: var(--code-font);
		font-weight: 700;
		font-size: clamp(1.875rem, 4.4vw, 3.25rem);
		line-height: 1.1;
		text-wrap: balance;
	}
	.chapo {
		margin: 0;
		font-size: 1.3125rem;
		line-height: 1.55;
		color: var(--color-grey-on-bg);
	}
	.pager {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
		border: 2px solid var(--color-text);
		margin-top: 2rem;
	}
	.pager a {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1.25rem;
		color: var(--color-text);
		text-decoration: none;
	}
	.pager a + a {
		border-left: 2px solid var(--color-text);
	}
	.pager a.next {
		text-align: right;
	}
	.pager a:hover,
	.pager a:focus-visible {
		background: var(--color-text);
		color: var(--color-background);
	}
	.pager a:hover .pmeta,
	.pager a:focus-visible .pmeta {
		color: var(--color-background);
	}
	.pmeta {
		font-family: var(--code-font);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-grey-on-bg);
	}
	.ptitle {
		font-family: var(--code-font);
		font-weight: 700;
		font-size: 1.125rem;
		line-height: 1.3;
	}
	@media (max-width: 520px) {
		.rail {
			position: static;
		}
		.pager a + a {
			border-left: none;
			border-top: 2px solid var(--color-text);
		}
	}
</style>
