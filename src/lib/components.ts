import { Youtube } from 'svelte-youtube-lite';
import type { Component } from 'svelte';

export const components: Record<string, Component> = {
	Youtube
};

export const componentNames = Object.keys(components);
