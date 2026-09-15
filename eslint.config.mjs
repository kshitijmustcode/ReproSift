import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    settings: {
      next: {
        rootDir: ['apps/dashboard/', 'apps/demo-store/'],
      },
    },
  },
  prettier,
  globalIgnores(['**/.next/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/next-env.d.ts']),
]);
