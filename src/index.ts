import { parseContact } from './contact';
import { formatContact, sendMessage } from './telegram';

function methodNotAllowed(allowed: string): Response {
	return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405, headers: { Allow: allowed } });
}

function notFound(): Response {
	return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
}

function invalid(): Response {
	return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
}

function deliveryFailed(): Response {
	return Response.json({ ok: false, error: 'delivery_failed' }, { status: 502 });
}

function preflight(origin: string): Response {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'POST',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '7200',
		},
	});
}

function withCors(response: Response, origin: string): Response {
	response.headers.set('Access-Control-Allow-Origin', origin);
	return response;
}

async function handleContact(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return methodNotAllowed('POST, OPTIONS');
	}
	const contentType = request.headers.get('Content-Type');
	if (contentType === null || !contentType.startsWith('application/json')) return invalid();
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return invalid();
	}
	const contact = parseContact(body);
	if (contact === null) return invalid();
	try {
		await sendMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, formatContact(contact));
	} catch (error) {
		console.error(error);
		return deliveryFailed();
	}
	return Response.json({ ok: true });
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname === '/contact') {
			if (request.method === 'OPTIONS') return preflight(env.ALLOWED_ORIGIN);
			return withCors(await handleContact(request, env), env.ALLOWED_ORIGIN);
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
