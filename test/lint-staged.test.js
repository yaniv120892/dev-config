import assert from 'node:assert/strict';
import { it } from 'node:test';
import lintStaged from '../lint-staged/index.js';

it('keeps eslint quiet about staged files its ignores skip', () => {
  const [eslint] = lintStaged['*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];
  assert.match(eslint, /--no-warn-ignored/);
});
