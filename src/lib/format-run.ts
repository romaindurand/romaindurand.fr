/** Vitesse lisible : « 0,8 élément/min », « 12 éléments/min ». */
export function formatRate(ratePerMin: number | null): string {
	if (ratePerMin === null) return 'vitesse inconnue';
	const value = ratePerMin >= 10 ? Math.round(ratePerMin) : Math.round(ratePerMin * 10) / 10;
	const text = String(value).replace('.', ',');
	return `${text} ${value >= 2 ? 'éléments' : 'élément'}/min`;
}

/** Temps restant lisible : « environ 12 min », « environ 1 h 35 min », « environ 2 h ». */
export function formatRemaining(ms: number | null): string {
	if (ms === null) return 'durée inconnue';
	if (ms === 0) return 'presque terminé';
	if (ms < 60_000) return "moins d'une minute";
	const minutes = Math.round(ms / 60_000);
	if (minutes < 60) return `environ ${minutes} min`;
	const rest = minutes % 60;
	return `environ ${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}

const KIND_LABELS: Record<string, string> = {
	'sync-new': 'Récupération des nouveaux éléments',
	'sync-older': 'Récupération des éléments antérieurs',
	scan: 'Vérification des fichiers',
	media: 'Récupération des médias'
};

/** Libellé français d'un type de job. */
export function kindLabel(kind: string): string {
	return KIND_LABELS[kind] ?? kind;
}

const OUTCOMES: Record<string, string> = {
	completed: 'terminé',
	limit: 'limite du lot atteinte (des éléments antérieurs peuvent rester)',
	stopped: 'arrêté',
	'request-cap': 'plafond de requêtes atteint',
	'session-expired': 'session Instagram expirée',
	'rate-limited': 'Instagram demande de ralentir : pause de 6 h'
};

/** Résumé d'une ligne du résultat d'un job terminé. */
export function describeResult(kind: string, result: unknown): string {
	const r = (result ?? {}) as Record<string, unknown>;
	if (typeof r.error === 'string') return `Erreur : ${r.error}`;
	const outcome = OUTCOMES[String(r.outcome ?? 'completed')] ?? String(r.outcome);
	const counts =
		kind === 'scan'
			? [
					['vérifiés', r.checked],
					['manquants', r.missing],
					['retrouvés', r.restored]
				]
			: kind === 'media'
				? [
						['récupérés', r.recovered],
						['indisponibles', r.unavailable],
						['échecs', r.failed]
					]
				: [
						['nouveaux', r.created],
						['étiquetés', r.tagged],
						['ignorés', r.skipped],
						['échecs', r.failed]
					];
	const text = counts.map(([label, value]) => `${label} : ${value ?? 0}`).join(' · ');
	const warnings = Array.isArray(r.warnings) && r.warnings.length ? ` ${r.warnings.join(' ')}` : '';
	return `${text} — ${outcome}.${warnings}`;
}
