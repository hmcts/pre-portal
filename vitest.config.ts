import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/unit/**/*.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*helper.ts', '**/test-helper.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      exclude: [
        'src/main/modules/properties-volume/*',
        'src/main/assets/js/*',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__mocks__/**',
      ],
    },
    setupFiles: [],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      'router': path.resolve(__dirname, './src/main/router'),
      'routes': path.resolve(__dirname, './src/main/routes'),
    },
  },
});

