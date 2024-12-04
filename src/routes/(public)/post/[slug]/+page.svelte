<script lang="ts">
	import PostBody from '$components/PostBody.svelte';
	import { formatDate } from 'date-fns';
	import { fr } from 'date-fns/locale';

	let { data } = $props();
	let post = $derived(data.post);
</script>

<div class="content">
	<h1 style={`view-transition-name: post-title-${post.id};`}>{post.title}</h1>
	<div class="date" style={`view-transition-name: post-date-${post.id};`}>
		Le {formatDate(post.createdAt, 'dd MMMM yyyy à HH:mm', {
			locale: fr
		})}
	</div>
	<p class="chapo" style={`view-transition-name: post-chapo-${post.id};`}>{post.chapo}</p>
	<PostBody html={post.html} />
</div>

<style>
	h1 {
		display: inline;
	}
	.date {
		margin-top: 0.5rem;
		color: var(--color-grey-on-bg);
	}

	.chapo {
		font-size: 1.2rem;
		margin-bottom: 3rem;
		margin-top: 0.5rem;
	}
</style>
