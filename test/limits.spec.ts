import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { countIpSubmissions, decide, type IpCounts } from '../src/limits';

const NOW = 1_800_000_000;
const IP = 'hash-a';

async function insertSubmission(ipHash: string, createdAt: number): Promise<void> {
	await env.DB.prepare('INSERT INTO submissions (ip_hash, created_at) VALUES (?1, ?2)').bind(ipHash, createdAt).run();
}

describe('countIpSubmissions', () => {
	beforeEach(async () => {
		await env.DB.prepare('DELETE FROM SUBMISSIONS').run();
	});
	it('returns zeros when the ip has no submissions', async () => {
		expect(await countIpSubmissions(env.DB, IP, NOW)).toEqual({ hour: 0, day: 0, week: 0, month: 0 });
	});

	it('counts a recent submission in every window', async () => {
		await insertSubmission(IP, NOW - 60);
		expect(await countIpSubmissions(env.DB, IP, NOW)).toEqual({ hour: 1, day: 1, week: 1, month: 1 });
	});

	it('counts each submission only in the windows that contain it', async () => {
		await insertSubmission(IP, NOW - 60); // 1 minute ago
		await insertSubmission(IP, NOW - 60 * 60 * 2); // 2 hours ago
		await insertSubmission(IP, NOW - 60 * 60 * 24 * 2); // 2 days ago
		await insertSubmission(IP, NOW - 60 * 60 * 24 * 10); // 10 days ago
		await insertSubmission(IP, NOW - 60 * 60 * 24 * 31); // 31 days ago
		expect(await countIpSubmissions(env.DB, IP, NOW)).toEqual({ hour: 1, day: 2, week: 3, month: 4 });
	});

	it('excludes a submission exactly one hour old from the hour window', async () => {
		await insertSubmission(IP, NOW - 60 * 60);
		expect(await countIpSubmissions(env.DB, IP, NOW)).toEqual({ hour: 0, day: 1, week: 1, month: 1 });
	});

	it('ignores submissions from other ips', async () => {
		await insertSubmission('hash-b', NOW - 60);
		expect(await countIpSubmissions(env.DB, IP, NOW)).toEqual({ hour: 0, day: 0, week: 0, month: 0 });
	});
});

// Each count is one below its limit
const BELOW_LIMITS: IpCounts = { hour: 1, day: 2, week: 3, month: 4 };

describe('decide', () => {
	it('allows when every count is below its limit', () => {
		expect(decide(BELOW_LIMITS, 19)).toBe('allow');
	});

	it.each([
		['hour', { ...BELOW_LIMITS, hour: 2 }],
		['day', { ...BELOW_LIMITS, day: 3 }],
		['week', { ...BELOW_LIMITS, week: 4 }],
	])('rate limits when the %s limit is reached', (_window, counts) => {
		expect(decide(counts, 0)).toBe('rate_limited');
	});

	it('blocks when the month limit is reached', () => {
		expect(decide({ ...BELOW_LIMITS, month: 5 }, 0)).toBe('block');
	});

	it('rate limits when the global daily limit is reached', () => {
		expect(decide(BELOW_LIMITS, 20)).toBe('rate_limited');
	});

	it('blocks before any other limit', () => {
		expect(decide({ hour: 2, day: 3, week: 4, month: 5 }, 20)).toBe('block');
	});
});
