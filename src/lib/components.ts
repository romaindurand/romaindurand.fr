import { Youtube } from 'svelte-youtube-lite';

export const components: Record<string, ConstructorOfATypedSvelteComponent> = {
	Youtube
};

export const componentNames = Object.keys(components);
