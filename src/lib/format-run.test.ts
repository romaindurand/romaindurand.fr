import { describe, expect, it } from 'vitest';
import { describeResult, formatRate, formatRemaining, kindLabel } from './format-run';

describe('formatRate', () => {
	it('uses a French decimal comma and a singular/plural unit', () => {
		expect(formatRate(0.8)).toBe('0,8 élément/min');
		expect(formatRate(12)).toBe('12 éléments/min');
		expect(formatRate(null)).toBe('vitesse inconnue');
		expect(formatRate(1.5)).toBe('1,5 élément/min');
		expect(formatRate(2)).toBe('2 éléments/min');
	});
});

describe('formatRemaining', () => {
	it('rounds to minutes and hours', () => {
		expect(formatRemaining(30_000)).toBe("moins d'une minute");
		expect(formatRemaining(12 * 60_000)).toBe('environ 12 min');
		expect(formatRemaining(95 * 60_000)).toBe('environ 1 h 35 min');
		expect(formatRemaining(120 * 60_000)).toBe('environ 2 h');
		expect(formatRemaining(59.5 * 60_000)).toBe('environ 1 h');
		expect(formatRemaining(0)).toBe('presque terminé');
		expect(formatRemaining(null)).toBe('durée inconnue');
	});
});

describe('kindLabel', () => {
	it('labels each job kind in French', () => {
		expect(kindLabel('sync-new')).toBe('Récupération des nouveaux éléments');
		expect(kindLabel('sync-older')).toBe('Récupération des éléments antérieurs');
		expect(kindLabel('scan')).toBe('Vérification des fichiers');
		expect(kindLabel('media')).toBe('Récupération des médias');
		expect(kindLabel('autre')).toBe('autre');
	});
});

describe('describeResult', () => {
	it('summarizes a sync with its outcome', () => {
		expect(
			describeResult('sync-older', { outcome: 'limit', created: 100, tagged: 3, skipped: 5 })
		).toBe(
			'nouveaux : 100 · étiquetés : 3 · ignorés : 5 · échecs : 0 — limite du lot atteinte (des éléments antérieurs peuvent rester).'
		);
	});
	it('summarizes media recovery and scan results', () => {
		expect(
			describeResult('media', { outcome: 'completed', recovered: 3, unavailable: 1, failed: 0 })
		).toBe('récupérés : 3 · indisponibles : 1 · échecs : 0 — terminé.');
		expect(describeResult('scan', { checked: 10, missing: 2, restored: 1 })).toBe(
			'vérifiés : 10 · manquants : 2 · retrouvés : 1 — terminé.'
		);
	});
	it('appends warnings and shows errors', () => {
		expect(
			describeResult('sync-new', { outcome: 'request-cap', created: 1, warnings: ['Attention.'] })
		).toBe(
			'nouveaux : 1 · étiquetés : 0 · ignorés : 0 · échecs : 0 — plafond de requêtes atteint. Attention.'
		);
		expect(describeResult('sync-new', { outcome: 'error', error: 'boom' })).toBe('Erreur : boom');
	});
});
