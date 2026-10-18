import { prisma } from '#lib/prisma.js';

/** Vide toutes les tables touchées par les tests (à appeler dans `afterEach`). */
export async function resetDb() {
	await prisma.syncRun.deleteMany();
	await prisma.instagramItem.deleteMany();
	await prisma.instagramSource.deleteMany();
	await prisma.instagramSession.deleteMany();
	await prisma.post.deleteMany();
	await prisma.tag.deleteMany();
}
