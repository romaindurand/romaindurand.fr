import { describe, expect, it } from 'vitest';
import { formatRate, formatRemaining } from './format-run';

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
