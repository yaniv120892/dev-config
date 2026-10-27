import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import prettier from 'eslint-config-prettier';
import promise from 'eslint-plugin-promise';
import tseslint from 'typescript-eslint';

const abbreviations = [
  'acc',
  'arr',
  'cfg',
  'ctx',
  'evt',
  'fn',
  'idx',
  'mgr',
  'msg',
  'num',
  'obj',
  'req',
  'res',
  'str',
  'svc',
  'tmp',
  'val',
];

export const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.claude/**',
  '**/next-env.d.ts',
];

export default tseslint.config(
  { name: 'dev-config/ignores', ignores },
  {
    name: 'dev-config/linter-options',
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  js.configs.recommended,
  tseslint.configs.strict,
  eslintComments.recommended,
  // Must precede the rules below: it switches `curly` off along with the formatting rules.
  prettier,
  {
    name: 'dev-config/rules',
    plugins: { promise },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'default-case': 'error',
      'id-denylist': ['error', ...abbreviations],
      'no-constant-condition': ['error', { checkLoops: 'all' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForStatement[test=null]',
          message: "Put the loop's stop condition in its header.",
        },
      ],
      'no-var': 'error',
      'object-shorthand': ['error', 'properties'],
      'prefer-const': 'error',
      'promise/prefer-await-to-then': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
);
