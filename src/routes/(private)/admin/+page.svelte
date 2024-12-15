<script lang="ts">
	import type { Post } from '@prisma/client';
	import type {} from './delete/[id]/$types';
	import LinkButton from '$components/LinkButton.svelte';

	let { data } = $props();
	let posts = $state(data.posts);

	async function deletePost(i: number) {
		try {
			const post = data.posts[i];
			if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
				const response = await fetch(`/admin/delete/${post.id}`, { method: 'DELETE' });
				const { deletedPost } = await response.json();
				posts = posts.filter((p: Post) => p.id !== deletedPost.id);
			}
		} catch (error) {
			console.error(error);
			alert('An error occurred');
		}
	}
</script>

<div class="new">
	<LinkButton href="/">←</LinkButton>
	<LinkButton href="admin/new">Nouveau post</LinkButton>
</div>
{#each data.posts as post, i (i)}
	<div class="post">
		<a href="/admin/edit/{post.id}">{post.title}</a>
		<button
			onclick={(e) => {
				e.preventDefault();
				deletePost(i);
			}}
		>
			<span role="img" aria-label="delete">❌</span>
		</button>
	</div>
{/each}

<style>
	.post {
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		border-top: 1px solid #ccc;
	}

	.new {
		margin-bottom: 1rem;
	}
</style>
