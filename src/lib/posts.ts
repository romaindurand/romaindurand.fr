/**
 * Voisins d'un post dans une liste triée du plus récent au plus ancien.
 * `newer` / `older` valent `null` aux extrémités ou si le post n'est pas dans la liste.
 */
export function getNeighbors<T extends { id: number }>(posts: T[], id: number) {
	const index = posts.findIndex((post) => post.id === id);
	if (index === -1) return { newer: null, older: null };
	return { newer: posts[index - 1] ?? null, older: posts[index + 1] ?? null };
}
