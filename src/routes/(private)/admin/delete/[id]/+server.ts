import { MEDIA_DIR } from '$app/env/private';
import { checkAuth } from '#lib/auth.js';
import { removeMediaFiles } from '#lib/instagram/media-storage.js';
import { deletePost, getMediaFiles } from '#lib/prisma.js';

export const DELETE = async (event) => {
	checkAuth(event);
	const id = Number(event.params.id);
	// les lignes PostMedia partent en cascade avec le post : lire les chemins avant
	const files = await getMediaFiles(id);
	const deletedPost = await deletePost(id);
	try {
		await removeMediaFiles(
			MEDIA_DIR,
			files.flatMap((file) => [file.path, ...(file.posterPath ? [file.posterPath] : [])])
		);
	} catch (error) {
		// le post est déjà supprimé : un fichier récalcitrant ne doit pas faire échouer la requête
		console.error('Nettoyage des médias impossible', error);
	}
	return Response.json({ ok: true, deletedPost });
};
