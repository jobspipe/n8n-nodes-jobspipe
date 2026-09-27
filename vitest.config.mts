import { defineConfig } from 'vitest/config';

const offline = process.env.OFFLINE === '1';

export default defineConfig({
	test: {
		globals: true,
		include: ['test/**/*.test.ts'],
		exclude: offline ? ['test/openapi.test.ts'] : [],
	},
});
