import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      '.strapi/**',
      '.cache/**',
      '.tmp/**',
      'node_modules/**',
      'src/admin/**',
      'public/**',
      'types/generated/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Umzug loads migrations, `npm run seed` runs scripts/seed.js directly
    // with `node`, and jest.config.js / tests/jest.setup.js run outside
    // ts-jest's transform entirely — all plain CommonJS outside the tsc
    // build, so they need their own Node globals.
    files: ['database/migrations/**/*.js', 'scripts/**/*.js', 'jest.config.js', 'tests/jest.setup.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
