<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import LinkButton from '#components/LinkButton.svelte';
	import RunProgress from '#components/RunProgress.svelte';

	let { data, form } = $props();
	let progress: ReturnType<typeof RunProgress> | undefined = $state();
	let message = $state('');

	const sessionOk = $derived(data.session.status === 'ok');
	const STATUS = { ok: 'active', expired: 'expirée', missing: 'absente' } as const;
	const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR') : '—');

	async function start(mode: string) {
		message = '';
		try {
			const response = await fetch(`/api/instagram/sync?mode=${mode}`, { method: 'POST' });
			if (response.status !== 202) {
				message = (await response.json().catch(() => null))?.error ?? `Erreur ${response.status}`;
			}
		} catch {
			message = 'Requête impossible : vérifiez la connexion.';
		}
		await progress?.refresh();
	}
</script>

<div class="top">
	<LinkButton href={resolve('/(private)/admin')}>←</LinkButton>
	<h1>Instagram</h1>
</div>

<RunProgress bind:this={progress} onfinished={invalidateAll} />
{#if message}<p class="error" role="alert">{message}</p>{/if}

<section>
	<h2>Session</h2>
	<p>
		Statut : <strong class:bad={!sessionOk}
			>{STATUS[data.session.status as keyof typeof STATUS]}</strong
		>
		· mise à jour : {date(data.session.updatedAt)}
	</p>
	<ol>
		<li>
			Dans ViolentMonkey, activez l'accès aux cookies HttpOnly : réglages avancés (option globale),
			puis les réglages du script (option du script).
		</li>
		<li>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href="/admin/instagram/userscript.user.js">Installer le userscript</a>
		</li>
		<li>
			Générez un jeton ci-dessous, puis ouvrez instagram.com connecté et cliquez sur « Envoyer la
			session au blog » (le jeton est demandé une seule fois).
		</li>
	</ol>
	<form method="post" action="?/generateToken" use:enhance>
		<button type="submit"
			>{data.session.hasToken ? 'Regénérer le jeton' : 'Générer le jeton'}</button
		>
		{#if data.session.hasToken}<small>Regénérer invalide l'ancien jeton (userscript et cron).</small
			>{/if}
	</form>
	{#if form?.token}
		<p>Jeton (affiché une seule fois) : <code>{form.token}</code></p>
	{/if}
</section>

<section>
	<h2>Sources</h2>
	{#if data.sources.length}
		<table>
			<thead>
				<tr><th>Source</th><th>Éléments</th><th>Dernière exécution</th><th>Antérieurs</th></tr>
			</thead>
			<tbody>
				{#each data.sources as source (source.key)}
					<tr>
						<td>{source.key}</td>
						<td>{source.count}</td>
						<td>{date(source.lastRunAt)}</td>
						<td>
							{#if source.hasMoreOlder === null}—{:else if source.hasMoreOlder}<strong
									>il en reste</strong
								>{:else}tout est récupéré{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p>Aucune synchronisation pour l'instant.</p>
	{/if}
	<div class="actions">
		<button type="button" disabled={!sessionOk} onclick={() => start('new')}>
			Récupérer les nouveaux
		</button>
		<button type="button" disabled={!sessionOk} onclick={() => start('older')}>
			Récupérer {data.settings.batchSize} antérieurs
		</button>
	</div>
	{#if !sessionOk}<p class="hint">Renouvelez d'abord la session Instagram.</p>{/if}
	<p>Cron (une fois par jour) :</p>
	<pre>0 7 * * * curl -fsS -X POST -H "Authorization: Bearer &lt;jeton&gt;" "{page.url
			.origin}/api/instagram/sync?mode=new"</pre>
</section>

<section>
	<h2>Médias</h2>
	<p>
		ok : {data.mediaCounts.ok ?? 0} · manquants : {data.mediaCounts.missing ?? 0} · indisponibles :
		{data.mediaCounts.unavailable ?? 0}
	</p>
	<div class="actions">
		<button type="button" onclick={() => start('scan')}>Vérifier les fichiers</button>
		<button type="button" disabled={!sessionOk} onclick={() => start('media')}>
			Récupérer les médias manquants ({data.settings.mediaBatchSize} posts par clic)
		</button>
	</div>
</section>

<section>
	<h2>Réglages</h2>
	<form method="post" action="?/saveSettings" use:enhance class="settings">
		<label>
			Taille d'un lot de récupération
			<input type="number" name="batchSize" min="1" max="1000" value={data.settings.batchSize} />
		</label>
		<label>
			Posts par lot de récupération de médias
			<input
				type="number"
				name="mediaBatchSize"
				min="1"
				max="1000"
				value={data.settings.mediaBatchSize}
			/>
		</label>
		<label>
			Plafond de requêtes par exécution
			<input
				type="number"
				name="maxRequests"
				min="1"
				max="1000"
				value={data.settings.maxRequests}
			/>
		</label>
		<label>
			Identifiant de requête des reposts (<code>repostsDocId</code>)
			<input type="text" name="repostsDocId" value={data.settings.repostsDocId} />
		</label>
		<button type="submit">Enregistrer</button>
		{#if form?.saved}<small role="status">Enregistré.</small>{/if}
	</form>
</section>

<style>
	.top {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	h1 {
		margin: 0 0 1rem;
	}
	section {
		margin-block: 2rem;
	}
	table {
		border-collapse: collapse;
		width: 100%;
	}
	th,
	td {
		text-align: left;
		padding: 0.5rem;
		border-top: 1px solid #ccc;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-block: 1rem;
	}
	button {
		min-height: 44px;
		padding: 0 1rem;
		cursor: pointer;
	}
	button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.bad,
	.error {
		color: #b60000;
	}
	.settings {
		display: grid;
		gap: 0.75rem;
		max-width: 32rem;
	}
	.settings label {
		display: grid;
		gap: 0.25rem;
	}
	pre {
		overflow-x: auto;
		padding: 0.75rem;
		background: #f2f2f2;
	}
</style>
