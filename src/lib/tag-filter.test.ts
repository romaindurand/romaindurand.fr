import { describe, expect, it } from 'vitest';
import {
	MAX_TAGS,
	buildTagWhere,
	describeSelectionText,
	parsePage,
	parseStatus,
	parseTagFilter,
	parseTagInput,
	tagFilterQuery,
	toggleTag
} from '#lib/tag-filter.js';

const params = (query: string) => new URLSearchParams(query);

describe('parseTagInput', () => {
	it('trims, drops empties and deduplicates', () => {
		expect(parseTagInput(' like, repost ,, like ,La base')).toEqual(['like', 'repost', 'La base']);
	});
});

describe('parseTagFilter', () => {
	it('defaults to no tag and mode all', () => {
		expect(parseTagFilter(params(''))).toEqual({ tags: [], mode: 'all' });
	});
	it('reads a comma separated list', () => {
		expect(parseTagFilter(params('tags=like,repost&mode=any'))).toEqual({
			tags: ['like', 'repost'],
			mode: 'any'
		});
	});
	it('reads repeated tags parameters (native GET form)', () => {
		expect(parseTagFilter(params('tags=like&tags=La+base&mode=all')).tags).toEqual([
			'like',
			'La base'
		]);
	});
	it('keeps only the first MAX_TAGS tags', () => {
		const names = Array.from({ length: MAX_TAGS + 5 }, (_, index) => `t${index}`);
		const filter = parseTagFilter(params(`tags=${names.join(',')}`));
		expect(filter.tags).toEqual(names.slice(0, MAX_TAGS));
		expect(MAX_TAGS).toBe(10);
	});
	it('falls back to all on an unknown mode', () => {
		expect(parseTagFilter(params('tags=a,b&mode=nope')).mode).toBe('all');
	});
});

describe('parseStatus / parsePage', () => {
	it('accepts only known statuses', () => {
		expect(parseStatus(params('status=draft'))).toBe('draft');
		expect(parseStatus(params('status=published'))).toBe('published');
		expect(parseStatus(params('status=x'))).toBe('all');
	});
	it('parses a positive page, defaults to 1', () => {
		expect(parsePage(params('page=3'))).toBe(3);
		expect(parsePage(params('page=0'))).toBe(1);
		expect(parsePage(params('page=abc'))).toBe(1);
		expect(parsePage(params(''))).toBe(1);
	});
	it('rejects trailing garbage, negatives, decimals and out of range pages', () => {
		for (const value of ['3abc', '-2', '2.5', '99999999999999999999', '10000', '007']) {
			expect(parsePage(params(`page=${value}`))).toBe(1);
		}
		expect(parsePage(params('page=9999'))).toBe(9999);
	});
});

describe('toggleTag', () => {
	it('adds then removes a tag, keeping the mode', () => {
		const added = toggleTag({ tags: ['like'], mode: 'any' }, 'repost');
		expect(added).toEqual({ tags: ['like', 'repost'], mode: 'any' });
		expect(toggleTag(added, 'like')).toEqual({ tags: ['repost'], mode: 'any' });
	});
});

describe('tagFilterQuery', () => {
	it('is empty without any parameter', () => {
		expect(tagFilterQuery({ tags: [], mode: 'all' })).toBe('');
	});
	it('serializes tags, non default mode, status and page', () => {
		expect(
			tagFilterQuery({ tags: ['like', 'repost'], mode: 'any' }, { status: 'draft', page: 2 })
		).toBe('?tags=like%2Crepost&mode=any&status=draft&page=2');
	});
	it('omits the mode when it is the default or when a single tag is selected', () => {
		expect(tagFilterQuery({ tags: ['like', 'repost'], mode: 'all' })).toBe('?tags=like%2Crepost');
		expect(tagFilterQuery({ tags: ['like'], mode: 'any' })).toBe('?tags=like');
	});
});

describe('buildTagWhere', () => {
	it('returns an empty filter without tags', () => {
		expect(buildTagWhere({ tags: [], mode: 'all' })).toEqual({});
	});
	it('uses some/in for mode any', () => {
		expect(buildTagWhere({ tags: ['a', 'b'], mode: 'any' })).toEqual({
			tags: { some: { name: { in: ['a', 'b'] } } }
		});
	});
	it('uses one some per tag for mode all', () => {
		expect(buildTagWhere({ tags: ['a', 'b'], mode: 'all' })).toEqual({
			AND: [{ tags: { some: { name: 'a' } } }, { tags: { some: { name: 'b' } } }]
		});
	});
});

describe('describeSelectionText', () => {
	it('describes the unfiltered list', () => {
		expect(describeSelectionText({ tags: [], mode: 'all' }, 'all', 128)).toBe(
			'Tous les articles : 128'
		);
		expect(describeSelectionText({ tags: [], mode: 'all' }, 'draft', 5)).toBe(
			'Tous les brouillons : 5'
		);
	});
	it('describes a single tag', () => {
		expect(describeSelectionText({ tags: ['like'], mode: 'all' }, 'all', 64)).toBe(
			'Articles avec le tag like : 64'
		);
		expect(describeSelectionText({ tags: ['saved'], mode: 'all' }, 'draft', 37)).toBe(
			'Brouillons avec le tag saved : 37'
		);
	});
	it('describes mode all with AND', () => {
		expect(describeSelectionText({ tags: ['like', 'repost'], mode: 'all' }, 'all', 12)).toBe(
			'Articles ayant like ET repost : 12'
		);
	});
	it('describes mode any with OR', () => {
		expect(describeSelectionText({ tags: ['like', 'repost'], mode: 'any' }, 'all', 91)).toBe(
			'Articles ayant like OU repost (ou les deux) : 91'
		);
		expect(describeSelectionText({ tags: ['a', 'b', 'c'], mode: 'any' }, 'published', 1)).toBe(
			'Articles publiés ayant a OU b OU c (ou plusieurs) : 1'
		);
	});
});
