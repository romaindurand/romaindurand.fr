import { describe, it, expect } from 'vitest';
import { formatPostDate } from '#lib/date.js';

describe('formatPostDate', () => {
	it('formats day with abbreviated french month and time on 24h', () => {
		// constructeur local : indépendant du fuseau de la machine
		const date = new Date(2024, 11, 9, 12, 34);
		expect(formatPostDate(date)).toEqual({ day: '9 déc. 2024', time: '12:34' });
	});

	it('does not pad the day', () => {
		expect(formatPostDate(new Date(2024, 11, 1, 8, 5))).toEqual({
			day: '1 déc. 2024',
			time: '08:05'
		});
	});
});
