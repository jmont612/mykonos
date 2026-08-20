import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
    },
    setupFiles: ['./tests/helpers/loadEnv.ts'],
    fileParallelism: false,
  },
});
