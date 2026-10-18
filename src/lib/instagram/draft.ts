import { instagramTag } from '../instagram-embed';
import type { IgItem } from './types';

const MAX_TITLE = 80;

/** Échappe `&`, `<` et `>` : le rendu markdown du blog accepte le HTML brut. */
export function escapeHtml(text: string) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Échappe par antislash les caractères spéciaux du markdown : une légende est du texte brut,
 * jamais de la syntaxe (sinon `[x](javascript:…)` deviendrait un lien cliquable).
 */
export function escapeMarkdown(text: string) {
	return text.replace(/[\\`*_[\]()!#>~|]/g, '\\$&');
}

function truncate(text: string, max: number) {
	const chars = [...text];
	return chars.length <= max
		? text
		: `${chars
				.slice(0, max - 1)
				.join('')
				.trimEnd()}…`;
}

/**
 * Titre, chapo et contenu markdown d'un brouillon créé depuis une publication Instagram.
 * Une image ou un carrousel est intégré par la balise `<Instagram code="…" />` ; une vidéo
 * n'en a pas besoin (elle est copiée en local).
 */
export function buildDraft(item: Pick<IgItem, 'author' | 'caption' | 'url' | 'code' | 'type'>) {
	const caption = item.caption.replaceAll('\r\n', '\n').trim();
	const firstLine =
		caption
			.split('\n')
			.find((line) => line.trim())
			?.trim() ?? '';
	const body = escapeMarkdown(escapeHtml(caption)).split('\n').join('  \n');
	const embed = item.type === 'video' ? null : instagramTag(item.code);
	const link = `[Voir sur Instagram](${item.url})`;
	return {
		title: firstLine ? truncate(firstLine, MAX_TITLE) : `@${item.author}`,
		chapo: `@${item.author} · Instagram`,
		content: [body, embed, link].filter(Boolean).join('\n\n')
	};
}
