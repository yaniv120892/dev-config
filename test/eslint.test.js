import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ESLint } from 'eslint';
import base from '../eslint/index.js';
import next from '../eslint/next.js';
import node from '../eslint/node.js';

async function ruleIdsFor({ config, code, filePath = 'src/fixture.ts' }) {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((message) => message.ruleId ?? message.message);
}

const violations = [
  ['curly', 'export function f(x: boolean) { if (x) return 1; return 2; }'],
  ['eqeqeq', 'export const same = (a: unknown, b: unknown) => a == b;'],
  ['default-case', 'export function f(x: string) { switch (x) { case "a": return 1; } return 2; }'],
  ['id-denylist', 'export const cfg = 1;'],
  ['no-constant-condition', 'export function f() { while (true) { break; } }'],
  ['no-restricted-syntax', 'export function f() { for (;;) { break; } }'],
  ['no-var', 'var count = 1; export { count };'],
  ['object-shorthand', 'const name = 1; export const record = { name: name };'],
  ['prefer-const', 'let count = 1; export { count };'],
  ['promise/prefer-await-to-then', 'export const load = (p: Promise<number>) => p.then(Number);'],
  [
    '@eslint-community/eslint-comments/require-description',
    '// eslint-disable-next-line eqeqeq\nexport const same = (a: unknown, b: unknown) => a == b;',
  ],
  ['@typescript-eslint/array-type', 'export type Names = Array<string>;'],
  ['@typescript-eslint/consistent-type-assertions', 'export const n = JSON.parse("1") as number;'],
  ['@typescript-eslint/consistent-type-definitions', 'export interface Shape { a: number }'],
  [
    '@typescript-eslint/consistent-type-imports',
    'import { ESLint } from "eslint"; export const x: ESLint | null = null;',
  ],
  [
    '@typescript-eslint/explicit-member-accessibility',
    'export class Counter { count = 0; increment() { this.count += 1; } }',
  ],
  ['@typescript-eslint/no-non-null-assertion', 'export const f = (x?: string) => x!.length;'],
  ['@typescript-eslint/no-unused-vars', 'const unused = 1;'],
];

describe('base ESLint config', () => {
  for (const [ruleId, code] of violations) {
    it(`reports ${ruleId}`, async () => {
      assert.ok((await ruleIdsFor({ config: base, code })).includes(ruleId));
    });
  }

  it('accepts code that follows the conventions', async () => {
    const code = [
      'import type { ESLint } from "eslint";',
      'export type Shape = { names: string[] };',
      'export const modes = ["a", "b"] as const;',
      'export class Counter {',
      '  private count = 0;',
      '  constructor(private readonly start: number) {}',
      '  public increment(_by: number): number { this.count += this.start; return this.count; }',
      '}',
      'export async function load(engine: ESLint | null): Promise<number> {',
      '  if (!engine) { return 0; }',
      '  return await Promise.resolve(1);',
      '}',
    ].join('\n');
    assert.deepEqual(await ruleIdsFor({ config: base, code }), []);
  });

  it('reports an unused disable directive', async () => {
    const code = '// eslint-disable-next-line eqeqeq -- not needed\nexport const one = 1;';
    const messages = await ruleIdsFor({ config: base, code });
    assert.equal(messages.length, 1);
    assert.match(messages[0], /Unused eslint-disable directive/);
  });
});

describe('node ESLint config', () => {
  it('knows Node globals in plain JS', async () => {
    const code = 'export const cwd = process.cwd();';
    assert.deepEqual(await ruleIdsFor({ config: node, code, filePath: 'bin/tool.js' }), []);
  });
});

describe('next ESLint config', () => {
  it('runs the Next rules alongside the base rules', async () => {
    const code = [
      'export interface Props { src: string }',
      'export function Avatar({ src }: Props) { return <img src={src} alt="" />; }',
    ].join('\n');
    const ruleIds = await ruleIdsFor({ config: next, code, filePath: 'src/app/page.tsx' });
    assert.ok(ruleIds.includes('@next/next/no-img-element'));
    assert.ok(ruleIds.includes('@typescript-eslint/consistent-type-definitions'));
  });
});
