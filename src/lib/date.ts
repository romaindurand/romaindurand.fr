import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Découpe la date d'un post en deux lignes pour le rail méta (`9 déc. 2024` / `12:34`).
 */
export function formatPostDate(date: Date | string | number) {
	return {
		day: format(date, 'd MMM yyyy', { locale: fr }),
		time: format(date, 'HH:mm')
	};
}
