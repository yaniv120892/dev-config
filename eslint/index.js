import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
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

const abbreviation = `/^(${abbreviations.join('|')})$/`;

// Names this code declares, not property keys: an external payload's `msg` field is not ours to rename.
const abbreviatedDeclaration = [
  `VariableDeclarator > Identifier.id[name=${abbreviation}]`,
  `ArrayPattern > Identifier[name=${abbreviation}]`,
  `ObjectPattern > Property > Identifier.value[name=${abbreviation}]`,
  `ObjectPattern > Property > AssignmentPattern.value > Identifier.left[name=${abbreviation}]`,
  `:function > Identifier.params[name=${abbreviation}]`,
  `:function > AssignmentPattern.params > Identifier.left[name=${abbreviation}]`,
  `TSParameterProperty > Identifier.parameter[name=${abbreviation}]`,
  `FunctionDeclaration > Identifier.id[name=${abbreviation}]`,
  `:matches(PropertyDefinition, MethodDefinition) > Identifier.key[name=${abbreviation}]`,
  `CatchClause > Identifier.param[name=${abbreviation}]`,
].join(', ');

/** Spread into a repo's own `no-restricted-syntax`: rule options replace, they do not merge. */
export const restrictedSyntax = [
  {
    selector: 'ForStatement[test=null]',
    message: "Put the loop's stop condition in its header.",
  },
  {
    selector: abbreviatedDeclaration,
    message: 'Name it with full words, not an abbreviation.',
  },
  {
    // An interface inside `declare module` / `declare global` is an augmentation, which only
    // declaration merging can express.
    selector: 'TSInterfaceDeclaration:not(TSModuleBlock TSInterfaceDeclaration)',
    message: 'Declare the shape with `type`, not `interface`.',
  },
];

export default defineConfig(
  {
    name: 'dev-config/ignores',
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.claude/**',
      '**/next-env.d.ts',
    ],
  },
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
      curly: 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'default-case': 'error',
      'no-constant-condition': ['error', { checkLoops: 'all' }],
      'no-restricted-syntax': ['error', ...restrictedSyntax],
      'no-var': 'error',
      'object-shorthand': ['error', 'properties'],
      'prefer-const': 'error',
      'promise/prefer-await-to-then': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    name: 'dev-config/typescript',
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'error',
    },
  },
  {
    name: 'dev-config/commonjs',
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
