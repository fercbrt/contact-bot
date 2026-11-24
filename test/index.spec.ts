import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('/contact', () => {
	it('returns 200 with { ok: true }', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'POST' });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it('returns 405 with Allow: POST for non-POST methods', async () => {
		const res = await SELF.fetch('https://example.com/contact');
		expect(res.status).toBe(405);
		expect(res.headers.get('Allow')).toBe('POST');
		expect(await res.json()).toEqual({ ok: false, error: 'method_not_allowed' });
	});
});

describe('/telegram', () => {
	it('returns 200 with { ok: true }', async () => {
		const res = await SELF.fetch('https://example.com/telegram', { method: 'POST' });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it('returns 405 with Allow: POST for non-POST methods', async () => {
		const res = await SELF.fetch('https://example.com/telegram');
		expect(res.status).toBe(405);
		expect(res.headers.get('Allow')).toBe('POST');
		expect(await res.json()).toEqual({ ok: false, error: 'method_not_allowed' });
	});
});

describe('unknown routes', () => {
	it('returns 404 with not_found error', async () => {
		const res = await SELF.fetch('https://example.com/not-found');
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ ok: false, error: 'not_found' });
	});

	it('returns 404 for /contact/ with trailing slash', async () => {
		const res = await SELF.fetch('https://example.com/contact/', { method: 'POST' });
		expect(res.status).toBe(404);
	});
});
