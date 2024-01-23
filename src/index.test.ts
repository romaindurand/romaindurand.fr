import { parseTag, splitOnComponent } from '$lib/markdown';
import { describe, it, expect } from 'vitest';

describe('splitOnComponent', () => {
	it('should split html on component', () => {
		const html = '<h1>title</h1>\n' + '<Youtube id="HdkJTOTY-Js"/>\n' + '<p>text</p>\n';
		const split = splitOnComponent(html, ['Youtube']);
		expect(split).toEqual(['<h1>title</h1>', '<Youtube id="HdkJTOTY-Js"/>', '<p>text</p>']);
	});

	it('should not split html before and after components', () => {
		const html =
			'<h1>title</h1>\n' +
			'<p>text1</p>\n' +
			'<Youtube id="HdkJTOTY-Js"/>\n' +
			'<p>text2</p>\n' +
			'<p>text3</p>\n';
		const split = splitOnComponent(html, ['Youtube']);
		console.log({ split });
		expect(split).toEqual([
			'<h1>title</h1><p>text1</p>',
			'<Youtube id="HdkJTOTY-Js"/>',
			'<p>text2</p><p>text3</p>'
		]);
	});

	it('should split html on multiple components', () => {
		const html =
			'<h1>title</h1>\n' +
			'<p>text1</p>\n' +
			'<Youtube id="HdkJTOTY-Js"/>\n' +
			'<p>text2</p>\n' +
			'<p>text3</p>\n' +
			'<Youtube id="HdkJTOTY-Js"/>\n' +
			'<p>text4</p>\n' +
			'<p>text5</p>\n';
		const split = splitOnComponent(html, ['Youtube']);
		expect(split).toEqual([
			'<h1>title</h1><p>text1</p>',
			'<Youtube id="HdkJTOTY-Js"/>',
			'<p>text2</p><p>text3</p>',
			'<Youtube id="HdkJTOTY-Js"/>',
			'<p>text4</p><p>text5</p>'
		]);
	});

	it('should recognize different components', () => {
		const html =
			'<h1>title</h1>\n' +
			'<p>text1</p>\n' +
			'<Youtube id="HdkJTOTY-Js"/>\n' +
			'<p>text2</p>\n' +
			'<p>text3</p>\n' +
			'<Youtube id="HdkJTOTY-Js"/>\n' +
			'<p>text4</p>\n' +
			'<p>text5</p>\n' +
			'<CodeBlock code="const a = 1;"/>\n' +
			'<p>text6</p>\n';
		const split = splitOnComponent(html, ['Youtube', 'CodeBlock']);
		expect(split).toEqual([
			'<h1>title</h1><p>text1</p>',
			'<Youtube id="HdkJTOTY-Js"/>',
			'<p>text2</p><p>text3</p>',
			'<Youtube id="HdkJTOTY-Js"/>',
			'<p>text4</p><p>text5</p>',
			'<CodeBlock code="const a = 1;"/>',
			'<p>text6</p>'
		]);
	});
});

describe('parseTag', () => {
	it('should parse tag name', () => {
		const tag = '<Youtube id="HdkJTOTY-Js"/>';
		const parsed = parseTag(tag);
		expect(parsed.name).toEqual('Youtube');
	});

	it('should parse tag attributes', () => {
		const tag = '<Youtube id="HdkJTOTY-Js"/>';
		const parsed = parseTag(tag);
		expect(parsed.attributes).toEqual({ id: 'HdkJTOTY-Js' });
	});

	it('should parse tag attributes with single quotes', () => {
		const tag = "<Youtube id='HdkJTOTY-Js'/>";
		const parsed = parseTag(tag);
		expect(parsed.attributes).toEqual({ id: 'HdkJTOTY-Js' });
	});

	it('should parse multiple tag attributes', () => {
		const tag = '<Youtube id="HdkJTOTY-Js" thumbnail="mqdefault" />';
		const parsed = parseTag(tag);
		expect(parsed.attributes).toEqual({ id: 'HdkJTOTY-Js', thumbnail: 'mqdefault' });
	});
});
