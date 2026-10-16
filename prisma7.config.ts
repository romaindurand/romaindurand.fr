import 'dotenv/config';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, env } from 'prisma/config';

const databaseUrl = env('DATABASE_URL');
const studioDatabaseUrl = databaseUrl.startsWith('file:./')
	? pathToFileURL(resolve(databaseUrl.slice('file:'.length))).href
	: databaseUrl;

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations'
	},
	datasource: {
		url: studioDatabaseUrl
	}
});
