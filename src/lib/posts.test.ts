import { describe, it, expect } from 'vitest';
import { getNeighbors } from '#lib/posts.js';

const posts = [{ id: 3 }, { id: 2 }, { id: 1 }];

describe('getNeighbors', () => {
	it('returns both neighbors for a middle post', () => {
		expect(getNeighbors(posts, 2)).toEqual({ newer: { id: 3 }, older: { id: 1 } });
	});
	it('has no newer neighbor for the latest post', () => {
		expect(getNeighbors(posts, 3)).toEqual({ newer: null, older: { id: 2 } });
	});
	it('has no older neighbor for the oldest post', () => {
		expect(getNeighbors(posts, 1)).toEqual({ newer: { id: 2 }, older: null });
	});
	it('returns nulls for an unknown (e.g. unpublished) post', () => {
		expect(getNeighbors(posts, 99)).toEqual({ newer: null, older: null });
	});
});
