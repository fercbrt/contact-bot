import type { Contact } from './contact';

export function formatContact(contact: Contact): string {
	return ['New contact', `Name: ${contact.name}`, `Email: ${contact.email}`, '', contact.message].join('\n');
}

export async function sendMessage(token: string, chatId: string, text: string): Promise<void> {
	const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			link_preview_options: { is_disabled: true },
		}),
	});

	if (!res.ok) {
		const data = (await res.json()) as { description?: string };
		throw new Error(`Telegram sendMessage failed: ${res.status} ${data.description}`);
	}
}
