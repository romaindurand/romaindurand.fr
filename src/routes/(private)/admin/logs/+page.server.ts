import { checkAuth } from '$lib/auth';
import { resolve } from 'node:path';
import { readFile } from 'fs/promises';
import type { PageServerLoad } from '../$types';
import { dev } from '$app/environment';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsPath = dev ? '../../../../../access.log' : '../../../access.log';

export const load: PageServerLoad = async (event) => {
	checkAuth(event);
	const logFile = await readFile(resolve(__dirname, logsPath), 'utf-8');
	const logs = parseLog(logFile);
	return {
		logs
	};
};

interface LogEntry {
	timestamp: number;
	level: string;
	logger: string;
	details: {
		request: {
			remote_addr: string;
			proto: string;
			method: string;
			host: string;
			uri: string;
			headers: Record<string, string[]>;
			tls: {
				resumed: boolean;
				version: number;
				cipher_suite: number;
				proto: string;
				proto_mutual: boolean;
				server_name: string;
			};
		};
		common_log: string;
		duration: number;
		size: number;
		status: number;
		resp_headers: Record<string, string[]>;
	};
}

function parseLog(log: string): LogEntry[] {
	const logEntries: LogEntry[] = [];
	const logLines = log.split('\n').filter((line) => line.trim() !== '');

	logLines.forEach((line) => {
		const [date, time, level, logger, ...rest] = line.split(/\s+/);
		const details = JSON.parse(rest.join(' ').split('handled request ')[1]);

		logEntries.push({
			timestamp: new Date(`${date} ${time}`).getTime(),
			level,
			logger,
			details
		});
	});

	return logEntries;
}
