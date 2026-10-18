<script lang="ts">
	interface Props {
		postId: number;
		media: { status: string; unavailableReason: string | null }[];
		onstarted?: () => void;
	}

	let { postId, media, onstarted }: Props = $props();

	const missing = $derived(media.filter((entry) => entry.status === 'missing').length);
	const unavailable = $derived(media.filter((entry) => entry.status === 'unavailable'));
	let message = $state('');

	async function recover() {
		message = '';
		try {
			const response = await fetch(`/api/instagram/sync?mode=media&postId=${postId}`, {
				method: 'POST'
			});
			if (response.status === 202) {
				message = 'Récupération lancée';
				onstarted?.();
			} else {
				const body = await response.json().catch(() => null);
				message = body?.error ?? `Erreur ${response.status}`;
			}
		} catch {
			message = 'Réseau indisponible';
		}
	}
</script>

{#if missing || unavailable.length}
	<span class="status">
		<span class="badge">
			{missing ? `média manquant${missing > 1 ? ` (${missing})` : ''}` : 'média indisponible'}
		</span>
		<button type="button" onclick={recover}>
			{missing ? 'Récupérer le média' : 'Réessayer'}
		</button>
		{#if unavailable.length}<small>{unavailable[0].unavailableReason}</small>{/if}
		{#if message}<small role="status">{message}</small>{/if}
	</span>
{/if}

<style>
	.status {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.badge {
		padding: 0 0.5rem;
		background: #b60000;
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 700;
	}
	button {
		min-height: 44px;
		padding: 0 0.75rem;
		cursor: pointer;
	}
</style>
