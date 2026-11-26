import { env, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const validContact = { name: 'Ana', email: 'ana@example.com', message: 'Hello there' };

describe('/contact', () => {
	it('returns 200 with { ok: true }', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'POST', body: JSON.stringify(validContact) });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it('returns 405 with Allow: POST and OPTIONS for non-POST methods', async () => {
		const res = await SELF.fetch('https://example.com/contact');
		expect(res.status).toBe(405);
		expect(res.headers.get('Allow')).toBe('POST, OPTIONS');
		expect(await res.json()).toEqual({ ok: false, error: 'method_not_allowed' });
	});

	it('returns 400 invalid when the body is not JSON', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'POST', body: 'not json' });
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
	});

	it('returns 400 invalid when the contact is not valid', async () => {
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			body: JSON.stringify({ ...validContact, email: 'no email' }),
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
	});
});

describe('/contact CORS', () => {
	it('answers the preflight with 204 and CORS headers', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'OPTIONS' });
		expect(res.status).toBe(204);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
		expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST');
		expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
		expect(res.headers.get('Access-Control-Max-Age')).toBe('7200');
	});

	it('adds the allowed origin to a successful POST', async () => {
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			body: JSON.stringify(validContact),
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
	});

	it('adds the allowed origin to a 400 response', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'POST', body: 'not json' });
		expect(res.status).toBe(400);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
	});

	it('adds the allowed origin to a 405 response', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'PUT' });
		expect(res.status).toBe(405);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
	});
});

describe('/telegram CORS', () => {
	it('does not add CORS headers', async () => {
		const res = await SELF.fetch('https://example.com/telegram', { method: 'POST' });
		expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
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
