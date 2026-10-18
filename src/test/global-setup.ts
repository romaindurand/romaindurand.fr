import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { testDbDir, testDbUrl } from './test-db';

export function setup() {
	rmSync(testDbDir, { recursive: true, force: true });
	mkdirSync(testDbDir, { recursive: true });
	execFileSync('npx', ['prisma', 'db', 'push', '--config', 'prisma7.config.ts'], {
		env: { ...process.env, DATABASE_URL: testDbUrl },
		stdio: 'inherit'
	});
}

export function teardown() {
	rmSync(testDbDir, { recursive: true, force: true });
}
