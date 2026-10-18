const CODE = /^[A-Za-z0-9_-]{1,64}$/;

/** Vrai si `code` est un code de publication Instagram sûr (lettres, chiffres, `_`, `-`). */
export function isInstagramCode(code: string): boolean {
	return CODE.test(code);
}

/** URL publique de la publication. `code` doit avoir été validé par {@link isInstagramCode}. */
export function instagramPostUrl(code: string): string {
	return `https://www.instagram.com/p/${code}/`;
}

/** URL de l'iframe d'embed de la publication. */
export function instagramEmbedUrl(code: string): string {
	return `${instagramPostUrl(code)}embed/`;
}

/** Balise markdown d'un embed (à placer seule sur sa ligne) ; `null` si le code est invalide. */
export function instagramTag(code: string): string | null {
	return isInstagramCode(code) ? `<Instagram code="${code}" />` : null;
}
