import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
			miniflare: {
					bindings: {
							TELEGRAM_BOT_TOKEN: 'test-token',
							TELEGRAM_CHAT_ID: '123',
					},
			},
		}),
	],
});
