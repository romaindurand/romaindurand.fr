import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// un dossier par copie de travail : des worktrees peuvent lancer Vitest en parallèle
const suffix = createHash('sha1').update(process.cwd()).digest('hex').slice(0, 8);

/** Dossier et URL de la base SQLite temporaire utilisée par Vitest. */
export const testDbDir = join(tmpdir(), `romaindurand-vitest-${suffix}`);
export const testDbUrl = `file:${join(testDbDir, 'test.db')}`;
