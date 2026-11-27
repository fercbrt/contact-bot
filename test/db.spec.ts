import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('D1 schema', () => {
	it('creates the submissions and blocked_ips tables', async () => {
		const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
		const names = results.map((row) => row.name);

		expect(names).toContain('submissions');
		expect(names).toContain('blocked_ips');
	});
});
