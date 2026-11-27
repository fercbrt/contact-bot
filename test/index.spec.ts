import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

const validContact = { name: 'Ana', email: 'ana@example.com', message: 'Hello there' };
const jsonHeaders = { 'Content-Type': 'application/json' };

describe('/contact', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ ok: true, result: {} }));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
	it('uses fake Telegram credentials in tests', () => {
		expect(env.TELEGRAM_BOT_TOKEN).toBe('test-token');
	});
	it('returns 200 with { ok: true }', async () => {
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			body: JSON.stringify(validContact),
			headers: jsonHeaders,
		});
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
		const res = await SELF.fetch('https://example.com/contact', { method: 'POST', body: 'not json', headers: jsonHeaders });
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
	});

	it('returns 400 invalid when the contact is not valid', async () => {
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			body: JSON.stringify({ ...validContact, email: 'no email' }),
			headers: jsonHeaders,
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
	});

	it('returns 400 invalid when Content-Type is text/plain', async () => {
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: JSON.stringify(validContact),
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
	});

	it('returns 400 invalid when Content-Type is not set', async () => {
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			body: JSON.stringify(validContact),
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
	});
	it('sends the contact to Telegram', async () => {
		await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify(validContact),
		});
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage');
		const sent = JSON.parse(init?.body as string);
		expect(sent.chat_id).toBe('123');
		expect(sent.text).toContain('Hello');
	});

	it('does not call Telegram for an invalid contact', async () => {
		await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify({ ...validContact, email: 'no email' }),
		});
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('returns 502 delivery_failed when Telegram fails', async () => {
		fetchSpy.mockImplementation(async () =>
			Response.json({ ok: false, error_code: 400, description: 'Bad Request: chat not found' }, { status: 400 }),
		);
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify(validContact),
		});
		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ ok: false, error: 'delivery_failed' });
	});
});

describe('/contact CORS', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ ok: true, result: {} }));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});
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
			headers: jsonHeaders,
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
	});

	it('adds the allowed origin to a 400 response', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'POST', body: 'not json', headers: jsonHeaders });
		expect(res.status).toBe(400);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
	});

	it('adds the allowed origin to a 405 response', async () => {
		const res = await SELF.fetch('https://example.com/contact', { method: 'PUT' });
		expect(res.status).toBe(405);
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);
	});

	it('adds the allowed origin to a 502 response', async () => {
		fetchSpy.mockImplementation(async () =>
			Response.json({ ok: false, error_code: 400, description: 'Bad Request: chat not found' }, { status: 400 }),
		);
		const res = await SELF.fetch('https://example.com/contact', {
			method: 'POST',
			headers: jsonHeaders,
			body: JSON.stringify(validContact),
		});
		expect(res.status).toBe(502);
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
