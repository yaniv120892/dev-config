import assert from 'node:assert/strict';
import { it } from 'node:test';
import lintStaged from '../lint-staged/index.js';

const [eslint] = lintStaged['*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];

it('keeps eslint quiet about staged files its ignores skip', () => {
  assert.match(eslint, /--no-warn-ignored/);
});

it('fixes what eslint can fix', () => {
  assert.match(eslint, /--fix\b/);
});

it('rejects warnings, as the CI gate does', () => {
  assert.match(eslint, /--max-warnings=0\b/);
});
