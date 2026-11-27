import { describe, expect, it } from 'vitest';
import { hashIp } from '../src/ip';

const KEY = 'test-ip-key';
const IP = '203.0.113.1';

describe('hashIp', () => {
	it.each([IP, '2001:db8::1'])('returns 64 lowercase hex characters for %s', async (ip) => {
		expect(await hashIp(ip, KEY)).toMatch(/^[0-9a-f]{64}$/);
	});

	it('matches the HMAC-SHA256 computed by openssl', async () => {
		expect(await hashIp(IP, KEY)).toBe('29014242d326a965550b741a1e291ebf90263d03daebb14ed4fceda89964b8f9');
	});

	it('is deterministic for the same ip and key', async () => {
		expect(await hashIp(IP, KEY)).toBe(await hashIp(IP, KEY));
	});

	it('gives different hashes for different ips', async () => {
		expect(await hashIp(IP, KEY)).not.toBe(await hashIp('203.0.113.2', KEY));
	});

	it('gives different hashes for different keys', async () => {
		expect(await hashIp(IP, KEY)).not.toBe(await hashIp(IP, 'other-key'));
	});
});
