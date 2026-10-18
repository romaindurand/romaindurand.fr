<script lang="ts">
	import { onMount } from 'svelte';
	import { describeResult, formatRate, formatRemaining, kindLabel } from '#lib/format-run.js';
	import type { RunView } from '#lib/instagram/runs.js';

	interface Props {
		compact?: boolean;
		onfinished?: () => void;
	}

	let { compact = false, onfinished }: Props = $props();

	let run: RunView | null = $state(null);
	let blockedUntil: string | null = $state(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const STATUS = {
		running: 'en cours',
		done: 'terminé',
		stopped: 'arrêté',
		failed: 'échec'
	} as const;

	let destroyed = false;
	let loaded = false;
	let sequence = 0;

	async function poll() {
		clearTimeout(timer);
		// Seul le dernier appel compte : un appel plus ancien encore en vol abandonne sans replanifier.
		const mine = ++sequence;
		let retry = true;
		try {
			const response = await fetch('/api/instagram/runs/current');
			if (mine !== sequence || destroyed) return;
			if (response.ok) {
				const data = await response.json();
				if (mine !== sequence || destroyed) return;
				const previous = run;
				run = data.run;
				blockedUntil = data.session?.blockedUntil ?? null;
				const finished =
					run?.status !== 'running' &&
					(previous?.status === 'running' || (loaded && run?.id !== previous?.id));
				loaded = true;
				if (finished) onfinished?.();
			} else if (response.status === 401) {
				retry = false; // session admin expirée : inutile d'insister
			}
		} catch {
			// réseau indisponible : on réessaie au prochain cycle
		}
		if (retry && run?.status === 'running') timer = setTimeout(poll, 2000);
	}

	/** Relit l'état tout de suite (à appeler après avoir lancé un job). */
	export function refresh() {
		return poll();
	}

	async function stop() {
		await fetch('/api/instagram/runs/stop', { method: 'POST' });
		await poll();
	}

	onMount(() => {
		poll();
		return () => {
			destroyed = true;
			clearTimeout(timer);
		};
	});

	const paused = $derived(
		blockedUntil && new Date(blockedUntil) > new Date() ? new Date(blockedUntil) : null
	);
</script>

{#if paused}
	<p class="pause" role="status">
		En pause jusqu'à {paused.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
		(anti-blocage Instagram).
	</p>
{/if}
{#if run && (run.status === 'running' || !compact)}
	<section class="run" class:compact aria-label="Suivi de l'opération">
		<h3>
			{kindLabel(run.kind)}
			<span class="state">{STATUS[run.status as keyof typeof STATUS] ?? run.status}</span>
		</h3>
		{#if run.status === 'running'}
			{#if run.total > 0}
				<progress max={run.total} value={run.done} aria-label="Progression"></progress>
			{:else}
				<progress aria-label="Progression indéterminée"></progress>
			{/if}
			<p>
				{run.done}{run.total > 0 ? ` / ${run.total}` : ''} · {formatRate(
					run.ratePerMin
				)}{run.total > 0 ? ` · reste ${formatRemaining(run.remainingMs)}` : ''}
			</p>
			{#if run.current}<p class="current">En cours : {run.current}</p>{/if}
			<button type="button" onclick={stop} disabled={run.stopRequested}>
				{run.stopRequested ? 'Arrêt demandé…' : 'Arrêter'}
			</button>
		{:else}
			<p>{describeResult(run.kind, run.result)}</p>
		{/if}
		{#if !compact && run.events.length}
			<details>
				<summary>Journal ({run.events.length})</summary>
				<ul>
					{#each [...run.events].reverse() as event, index (index)}
						<li><time>{new Date(event.t).toLocaleTimeString('fr-FR')}</time> {event.message}</li>
					{/each}
				</ul>
			</details>
		{/if}
	</section>
{/if}

<style>
	.run {
		border: 2px solid var(--color-text, #111);
		padding: 1rem;
		margin-block: 1rem;
	}
	.run.compact {
		padding: 0.5rem 1rem;
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}
	.state {
		font-weight: 400;
		margin-left: 0.5rem;
	}
	progress {
		width: 100%;
		height: 1.25rem;
	}
	p {
		margin: 0.5rem 0;
	}
	.pause {
		padding: 0.5rem 1rem;
		border: 2px solid #b60000;
		color: #b60000;
		font-weight: 700;
	}
	button {
		min-height: 44px;
		padding: 0 1rem;
		cursor: pointer;
	}
	ul {
		max-height: 14rem;
		overflow: auto;
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
		font-size: 0.875rem;
	}
</style>
