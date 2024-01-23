<script lang="ts">
	import { onMount, tick } from 'svelte';
	import './PostBody.css';

	import { Youtube } from 'svelte-youtube-lite';
	import { targetBlankLinks } from '$lib';

	export let content: string = '';
	let splitHtml: string[] = [];

	onMount(targetBlankLinks);

	function getYoutubeIdFromUrl(url: string) {
		const youtubeUrl = new URL(url);
		const youtubeId = youtubeUrl.searchParams.get('v');
		return youtubeId;
	}

	function getYoutubeIdFromHtmlLine(line: string) {
		return line.replace('<p>!yt:', '').replace('</p>', '');
	}

	function shouldReplaceByYoutubeComponent(line: string) {
		return line.startsWith('<p>!yt:');
	}

	$: {
		splitHtml = content.split('\n<p>!yt:').reduce((memo, line, index) => {
			if (index === 0) {
				memo.push(line);
				return memo;
			}
			const [youtubeUrl, ...rest] = line.split('</p>');
			memo.push(`<p>!yt:${getYoutubeIdFromUrl(youtubeUrl)}</p>`);
			memo.push(rest.join('</p>'));
			return memo;
		}, [] as string[]);

		tick().then(() => {
			targetBlankLinks();
		});
	}
</script>

<div class="PostBody">
	{#each splitHtml as line}
		{#if shouldReplaceByYoutubeComponent(line)}
			<Youtube id={getYoutubeIdFromHtmlLine(line)} />
		{:else}
			{@html line}
		{/if}
	{/each}
</div>
