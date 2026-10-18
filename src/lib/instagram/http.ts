/** Renvoie un `fetch` qui interrompt la requête après `timeoutMs` (sans écraser un `signal` fourni). */
export function fetchWithTimeout(timeoutMs = 30_000): typeof fetch {
	return (input, init) =>
		fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });
}
