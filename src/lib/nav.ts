/** Entrées de la navigation principale, dans l'ordre d'affichage. `slug` est le segment d'URL. */
export const navItems = [
	{ slug: '', label: 'BLOG', path: '~/blog' },
	{ slug: 'projects', label: 'PROJETS', path: '~/projets' },
	{ slug: 'contact', label: 'CONTACT', path: '~/contact' },
	{ slug: 'about', label: 'À PROPOS', path: '~/a-propos' }
] as const;

/** Index de l'entrée active pour un pathname ; les articles comptent comme « BLOG ». */
export function getActiveIndex(pathname: string): number {
	const first = pathname.split('/').filter(Boolean)[0] ?? '';
	const index = navItems.findIndex((item) => item.slug === first);
	return index === -1 ? 0 : index;
}
