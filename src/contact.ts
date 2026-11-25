export interface Contact {
	name: string;
	email: string;
	message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContact(body: unknown): Contact | null {
	if (typeof body !== 'object' || body === null) return null;

	const { name, email, message } = body as Record<string, unknown>;

	if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') return null;

	const contact = { name: name.trim(), email: email.trim(), message: message.trim() };
	if (
		contact.name.length === 0 ||
		contact.name.length > 100 ||
		contact.email.length > 254 ||
		!EMAIL_PATTERN.test(contact.email) ||
		contact.message.length < 5 ||
		contact.message.length > 3000
	)
		return null;

	return contact;
}
