<script lang="ts">
	interface Media {
		id: number;
		kind: string;
		path: string;
		posterPath: string | null;
		width: number;
		height: number;
	}

	interface Props {
		media: Media[];
		title: string;
	}

	let { media, title }: Props = $props();

	const video = $derived(media.find((entry) => entry.kind === 'video'));
	const ratio = $derived(
		video && video.width > 0 && video.height > 0 ? video.width / video.height : 1
	);
	const src = (path: string) => `/media/${path}`;
	// lié à l'id de la vidéo : naviguer d'un article à un autre ne lance pas la lecture tout seul
	let playingId: number | null = $state(null);
	const playing = $derived(video !== undefined && playingId === video.id);
</script>

{#if video}
	<div class="media" class:portrait={ratio < 1} style:--ratio={ratio}>
		<div class="frame">
			{#if playing}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					controls
					autoplay
					playsinline
					preload="none"
					poster={video.posterPath ? src(video.posterPath) : undefined}
					src={src(video.path)}
				></video>
			{:else}
				<button
					type="button"
					class="facade"
					aria-label={`Lire la vidéo : ${title}`}
					onclick={() => (playingId = video.id)}
				>
					{#if video.posterPath}<img src={src(video.posterPath)} alt="" loading="lazy" />{/if}
					<span class="play" aria-hidden="true">
						<svg width="28" height="28" viewBox="0 0 24 24"
							><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg
						>
					</span>
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.media {
		width: 100%;
	}
	.media.portrait {
		width: min(320px, 100%);
	}
	.frame {
		position: relative;
		aspect-ratio: var(--ratio);
		overflow: hidden;
		border: 2px solid var(--color-text);
		background: var(--color-surface);
	}
	img,
	video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.facade {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: var(--color-surface);
		cursor: pointer;
	}
	.facade img {
		position: absolute;
		inset: 0;
	}
	.play {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		background: var(--color-red-on-bg);
		color: var(--color-on-accent);
		border: 2px solid var(--color-text);
	}
	.facade:hover .play,
	.facade:focus-visible .play {
		background: var(--color-text);
		color: var(--color-background);
	}
	.facade:focus-visible {
		outline: 4px solid var(--color-red-on-bg);
		outline-offset: 4px;
	}
</style>
