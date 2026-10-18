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
