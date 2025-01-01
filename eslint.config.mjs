import typescriptEslint from '@typescript-eslint/eslint-plugin';
import checkFile from 'eslint-plugin-check-file';
import react from 'eslint-plugin-react';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/index.tsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'check-file': checkFile,
      react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      quotes: ['error', 'single'],
      
      'no-console': 'error',

      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.ts': 'KEBAB_CASE',
          '**/*.tsx': 'PASCAL_CASE',
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'react/react-in-jsx-scope': 'off',

      'react/jsx-sort-props': [
        'error',
        {
          ignoreCase: true,
          callbacksLast: false,
          shorthandFirst: false,
          shorthandLast: false,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],

      'react/prop-types': 'off',
    },
  },
];