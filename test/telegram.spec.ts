import { afterEach, describe, it, expect, vi } from 'vitest';
import { formatContact, sendMessage } from '../src/telegram';

const contact = { name: 'Ana', email: 'ana@example.com', message: 'Hello there' };

describe('formatContact', () => {
	it('includes name, email and message', () => {
		const text = formatContact(contact);
		expect(text).toContain(contact.name);
		expect(text).toContain(contact.email);
		expect(text).toContain(contact.message);
	});

	it('produces the exact expected layout', () => {
		expect(formatContact(contact)).toBe(`New contact\nName: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`);
	});

	it('keeps user text literally, without escaping', () => {
		const message = '<b>hola</b> <a href="https://x.com">click</a>';
		expect(formatContact({ ...contact, message })).toContain(message);
	});

	it('fits within the Telegram limit of 4096 characters', () => {
		const longest = {
			name: 'a'.repeat(100),
			email: 'a'.repeat(254),
			message: 'a'.repeat(3000),
		};
		expect(formatContact(longest).length).toBeLessThanOrEqual(4096);
	});
});

describe('sendMessage', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('POSTs the message to the Telegram API', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true, result: {} }));

		await sendMessage('test-token', '123', 'Hello');

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(init?.body as string)).toEqual({
			chat_id: '123',
			text: 'Hello',
			link_preview_options: { is_disabled: true },
		});
	});

	it('throws with status and description when Telegram fails', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			Response.json({ ok: false, error_code: 400, description: 'Bad Request: chat not found' }, { status: 400 }),
		);

		await expect(sendMessage('test-token', '123', 'Hello')).rejects.toThrow('400 Bad Request: chat not found');
	});

	it('does not leak the token in the error message', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			Response.json({ ok: false, error_code: 401, description: 'Unauthorized' }, { status: 401 }),
		);

		await expect(sendMessage('test-token', '123', 'Hello')).rejects.not.toThrow('test-token');
	});
});
