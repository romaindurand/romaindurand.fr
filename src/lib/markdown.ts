// given an html string, should return a string array with matching components on their own line
// this allows to render html before, after, or between components in one go (eg: lists renders incorrectly if split)
export function splitOnComponent(markdown: string, components: string[]): string[] {
	const lines = markdown.split('\n');
	let preFlag = false;
	const result = lines.reduce(
		(acc, line) => {
			if (line.includes('<pre')) preFlag = true;
			if (line.includes('</pre>')) preFlag = false;
			if (preFlag) {
				line += '\n';
			}
			if (matchesComponent(line, components)) {
				acc.push(line);
				acc.push('');
			} else {
				acc[acc.length - 1] += line;
			}

			return acc;
		},
		['']
	);
	return result;
}

export function matchesComponent(text: string, components: string[]): boolean {
	return components.some((component) => text.startsWith(`<${component}`));
}

export function parseTag(tag: string): {
	name: string;
	attributes: Record<string, string> | undefined;
} {
	const name = tag.match(/<(\w+)/)?.[1] ?? '';
	const attributes = tag.match(/(\w+)=["'](.+?)["']/g)?.reduce(
		(acc, attribute) => {
			const [key, value] = attribute.split('=');
			acc[key] = value.replace(/["']/g, '');
			return acc;
		},
		{} as Record<string, string>
	);

	return { name, attributes };
}
