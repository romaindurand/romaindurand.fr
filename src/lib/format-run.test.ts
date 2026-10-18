import { describe, expect, it } from 'vitest';
import { formatRate, formatRemaining } from './format-run';

describe('formatRate', () => {
	it('uses a French decimal comma and a singular/plural unit', () => {
		expect(formatRate(0.8)).toBe('0,8 élément/min');
		expect(formatRate(12)).toBe('12 éléments/min');
		expect(formatRate(null)).toBe('vitesse inconnue');
	});
});

describe('formatRemaining', () => {
	it('rounds to minutes and hours', () => {
		expect(formatRemaining(30_000)).toBe("moins d'une minute");
		expect(formatRemaining(12 * 60_000)).toBe('environ 12 min');
		expect(formatRemaining(95 * 60_000)).toBe('environ 1 h 35 min');
		expect(formatRemaining(0)).toBe('presque terminé');
		expect(formatRemaining(null)).toBe('durée inconnue');
	});
});
