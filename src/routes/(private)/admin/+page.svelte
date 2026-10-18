<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import LinkButton from '#components/LinkButton.svelte';
	import MediaStatus from '#components/MediaStatus.svelte';
	import RunProgress from '#components/RunProgress.svelte';
	import TagFilter from '#components/TagFilter.svelte';
	import { tagFilterQuery } from '#lib/tag-filter.js';

	let { data } = $props();
	let progress: ReturnType<typeof RunProgress> | undefined = $state();

	const admin = resolve('/(private)/admin');
	const href = (page: number) =>
		`${admin}${tagFilterQuery(data.filter, { status: data.status, page })}`;
	const hasNext = $derived(data.page * data.pageSize < data.total);

	function thumb(media: (typeof data.posts)[number]['media']) {
		const first = media.find((entry) => entry.status === 'ok');
		return first ? (first.kind === 'video' ? first.posterPath : first.path) : null;
	}

	async function deletePost(id: number, title: string) {
		if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
		try {
			const response = await fetch(`/admin/delete/${id}`, { method: 'DELETE' });
			if (!response.ok) throw new Error(String(response.status));
			await invalidateAll();
		} catch (error) {
			console.error(error);
			alert('An error occurred');
		}
	}
</script>

<div class="new">
	<LinkButton href={resolve('/(public)')}>←</LinkButton>
	<LinkButton href={resolve('/(private)/admin/new')}>Nouveau post</LinkButton>
	<LinkButton href={resolve('/(private)/admin/instagram')}>Instagram</LinkButton>
</div>

<RunProgress compact bind:this={progress} onfinished={invalidateAll} />

<TagFilter
	tags={data.tagCounts}
	filter={data.filter}
	status={data.status}
	total={data.total}
	resetHref={admin}
	showStatus
/>

<ul class="posts">
	{#each data.posts as post (post.id)}
		{@const image = thumb(post.media)}
		<li class="post">
			{#if image}
				<img class="thumb" src={`/media/${image}`} alt="" width="64" height="64" loading="lazy" />
			{:else}
				<span class="thumb empty" aria-hidden="true"></span>
			{/if}
			<div class="info">
				<a href={resolve('/(private)/admin/edit/[id]', { id: String(post.id) })}
					>{post.title || '(sans titre)'}</a
				>
				<span class="line">
					<span class="badge" class:draft={!post.published}>
						{post.published ? 'Publié' : 'Brouillon'}
					</span>
					{#each post.tags as tag (tag.name)}<span class="tag">{tag.name}</span>{/each}
				</span>
				<MediaStatus postId={post.id} media={post.media} onstarted={() => progress?.refresh()} />
			</div>
			<button
				type="button"
				onclick={() => deletePost(post.id, post.title)}
				aria-label={`Supprimer ${post.title}`}
			>
				<span role="img" aria-label="delete">❌</span>
			</button>
		</li>
	{/each}
</ul>

{#if data.page > 1 || hasNext}
	<nav class="pager" aria-label="Pagination">
		{#if data.page > 1}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={href(data.page - 1)}>← Plus récents</a>
		{/if}
		<span>Page {data.page}</span>
		{#if hasNext}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={href(data.page + 1)}>Plus anciens →</a>
		{/if}
	</nav>
{/if}

<style>
	.new {
		margin-bottom: 1rem;
	}
	.posts {
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}
	.post {
		display: grid;
		grid-template-columns: 64px 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-top: 1px solid #ccc;
	}
	.thumb {
		width: 64px;
		height: 64px;
		object-fit: cover;
		background: #e0e0e0;
	}
	.info {
		display: grid;
		gap: 0.375rem;
		min-width: 0;
	}
	.line {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.badge,
	.tag {
		padding: 0 0.5rem;
		border: 1px solid #111;
		font-size: 0.8125rem;
	}
	.badge.draft {
		background: #111;
		color: #eee;
	}
	.post > button {
		min-width: 44px;
		min-height: 44px;
		cursor: pointer;
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.5rem;
	}
</style>
