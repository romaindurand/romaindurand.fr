<script lang="ts">
	import './PostBody.css';

	import showdown from 'showdown';
	import showdownHighlight from 'showdown-highlight';
	import { Youtube } from 'svelte-youtube-lite';

	export let markdown: string = '';

	const converter = new showdown.Converter({
		extensions: [
			showdownHighlight({
				auto_detection: true
			})
		]
	});

	function getYoutubeIdFromUrl(url: string) {
		const youtubeUrl = new URL(url);
		const youtubeId = youtubeUrl.searchParams.get('v');
		return youtubeId;
	}

	$: html = converter.makeHtml(markdown);
	$: splitHtml = html.split('\n<p>!yt:').reduce((memo, line, index) => {
		if (index === 0) {
			memo.push(line);
			return memo;
		}
		const [youtubeUrl, ...rest] = line.split('</p>');
		memo.push(`<p>!yt:${getYoutubeIdFromUrl(youtubeUrl)}</p>`);
		memo.push(rest.join('</p>'));
		return memo;
	}, [] as string[]);
</script>

<div class="PostBody">
	{#each splitHtml as line}
		{#if line.includes('!yt:')}
			<Youtube id={line.replace('<p>!yt:', '').replace('</p>', '')} />
		{:else}
			{@html line}
		{/if}
	{/each}
</div>
