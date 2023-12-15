import { writable } from "svelte/store";

export const sessions = writable<string[]>([]);


export const sessionDuration = 1000 * 60 * 60 * 24 * 7