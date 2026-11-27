import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
			miniflare: {
				bindings: {
					TELEGRAM_BOT_TOKEN: 'test-token',
					TELEGRAM_CHAT_ID: '123',
					TEST_MIGRATIONS: await readD1Migrations('./migrations'),
				},
			},
		}),
	],
	test: {
		setupFiles: ['./test/apply-migrations.ts'],
	},
});
