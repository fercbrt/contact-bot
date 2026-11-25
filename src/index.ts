import { parseContact } from './contact';

function methodNotAllowed(allowed: string): Response {
	return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405, headers: { Allow: allowed } });
}

function notFound(): Response {
	return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
}

function invalid(): Response {
	return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname === '/contact') {
			if (request.method !== 'POST') {
				return methodNotAllowed('POST');
			}
			let body: unknown;
			try {
				body = await request.json();
			} catch {
				return invalid();
			}
			const contact = parseContact(body);
			if (contact === null) return invalid();
			return Response.json({ ok: true });
		}

		if (pathname === '/telegram') {
			if (request.method !== 'POST') {
				return methodNotAllowed('POST');
			}
			return Response.json({ ok: true });
		}

		return notFound();
	},
} satisfies ExportedHandler<Env>;
