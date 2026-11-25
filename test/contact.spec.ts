import { describe, it, expect } from 'vitest';
import { parseContact } from '../src/contact';

// A valid contact used as a base: each test changes only what it is testing
const valid = { name: 'Ana', email: 'ana@example.com', message: 'Hello there' };

describe('parseContact', () => {
	describe('valid input', () => {
		it('returns the contact for a valid body', () => {
			expect(parseContact(valid)).toEqual(valid);
		});

		it('trims whitespace from all fields', () => {
			const result = parseContact({ name: ' Ana ', email: ' ana@example.com ', message: ' Hello there ' });
			expect(result).toEqual(valid);
		});

		it('accepts a message of exactly the minimum length', () => {
			expect(parseContact({ ...valid, message: '12345' })).not.toBeNull();
		});
	});

	describe('invalid body shape', () => {
		it.each([
			['null', null],
			['a string', 'hello'],
			['a number', 42],
			['an array', ['Ana', 'ana@example.com', 'Hello there']],
		])('returns null for %s', (_label, body) => {
			expect(parseContact(body)).toBeNull();
		});

		it('returns null when a field is missing', () => {
			const { email, ...withoutEmail } = valid;
			expect(parseContact(withoutEmail)).toBeNull();
		});

		it('returns null when a field is not a string', () => {
			expect(parseContact({ ...valid, name: 42 })).toBeNull();
		});
	});

	describe('name', () => {
		it('returns null when only whitespace', () => {
			expect(parseContact({ ...valid, name: '      ' })).toBeNull();
		});

		it('returns null when longer than the maximum', () => {
			expect(parseContact({ ...valid, name: 'a'.repeat(101) })).toBeNull();
		});
	});

	describe('email', () => {
		it.each(['ana@example.com', 'a.b+tag@mail.co.uk'])('accepts %s', (email) => {
			expect(parseContact({ ...valid, email })).not.toBeNull();
		});

		it.each(['ana@example', 'ana example@x.com', 'ana@@x.com', '@x.com'])('rejects %s', (email) => {
			expect(parseContact({ ...valid, email })).toBeNull();
		});

		it('returns null when longer than the maximum', () => {
			// Make it valid in shape but too long
			const longEmail = 'a'.repeat(243) + '@example.com';
			expect(parseContact({ ...valid, email: longEmail })).toBeNull();
		});
	});

	describe('message', () => {
		it('returns null when shorter than the minimum', () => {
			expect(parseContact({ ...valid, message: 'wave' })).toBeNull();
		});

		it('returns null when only whitespace', () => {
			expect(parseContact({ ...valid, message: '      ' })).toBeNull();
		});

		it('returns null when longer than the maximum', () => {
			expect(parseContact({ ...valid, message: 'a'.repeat(3001) })).toBeNull();
		});
	});
});
