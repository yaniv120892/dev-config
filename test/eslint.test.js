import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ESLint } from 'eslint';
import base from '../eslint/index.js';
import next from '../eslint/next.js';
import node from '../eslint/node.js';

const engines = new Map();

async function findingsFor({ config, code, filePath = 'src/fixture.ts' }) {
  if (!engines.has(config)) {
    engines.set(config, new ESLint({ overrideConfigFile: true, overrideConfig: config }));
  }
  const [result] = await engines.get(config).lintText(code, { filePath });
  return result.messages.map((message) => ({ ruleId: message.ruleId, message: message.message }));
}

async function ruleIdsFor(options) {
  return (await findingsFor(options)).map((finding) => finding.ruleId ?? finding.message);
}

const violations = [
  ['curly', 'export function f(x: boolean) { if (x) return 1; return 2; }'],
  ['eqeqeq', 'export const same = (a: unknown, b: unknown) => a == b;'],
  ['default-case', 'export function f(x: string) { switch (x) { case "a": return 1; } return 2; }'],
  ['no-constant-condition', 'export function f() { while (true) { break; } }'],
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
  [
    '@typescript-eslint/consistent-type-imports',
    'import { ESLint } from "eslint"; export const x: ESLint | null = null;',
  ],
  [
    '@typescript-eslint/explicit-member-accessibility',
    'export class Counter { count = 0; increment() { this.count += 1; } }',
  ],
  ['@typescript-eslint/explicit-member-accessibility', 'export class Clock { constructor() {} }'],
  ['@typescript-eslint/no-non-null-assertion', 'export const f = (x?: string) => x!.length;'],
  ['@typescript-eslint/no-unused-vars', 'const unused = 1;'],
];

const restrictedSyntax = [
  ['a loop with no stop condition in its header', 'export function f() { for (;;) { break; } }'],
  ['an abbreviated variable', 'export const cfg = 1;'],
  ['an abbreviated parameter', 'export const total = (items: number[], acc = 0) => acc;'],
  [
    'an abbreviated destructured name',
    'export function f({ msg }: { msg: string }) { return msg; }',
  ],
  [
    'an abbreviated catch parameter',
    'export function f() { try { f(); } catch (evt) { throw evt; } }',
  ],
  ['an abbreviated array-destructured name', 'export const [res] = [1];'],
  [
    'an abbreviated destructured name with a default',
    'export function f({ msg = "" }: { msg?: string }) { return msg; }',
  ],
  ['an abbreviated class field', 'export class A { private ctx = 1; }'],
  ['an abbreviated method', 'export class A { public fn() { return 1; } }'],
  [
    'an abbreviated parameter property',
    'export class A { public constructor(private readonly cfg: number) {} }',
  ],
  ['an interface for an ordinary shape', 'export interface Shape { a: number }'],
];

describe('base ESLint config', () => {
  for (const [ruleId, code] of violations) {
    it(`reports ${ruleId}`, async () => {
      assert.ok((await ruleIdsFor({ config: base, code })).includes(ruleId));
    });
  }

  for (const [what, code] of restrictedSyntax) {
    it(`reports ${what}`, async () => {
      assert.ok((await ruleIdsFor({ config: base, code })).includes('no-restricted-syntax'));
    });
  }

  it('accepts an interface that augments a module or the global scope', async () => {
    const code = [
      'declare module "@mui/material/styles" {',
      '  interface Palette { charts: string[] }',
      '  export interface PaletteOptions { charts?: string[] }',
      '}',
      'declare global { interface Window { analytics: unknown } }',
      'export {};',
    ].join('\n');
    assert.deepEqual(await ruleIdsFor({ config: base, code }), []);
  });

  it('accepts code that follows the conventions', async () => {
    const code = [
      'import type { ESLint } from "eslint";',
      'export type Shape = { names: string[] };',
      'export const modes = ["a", "b"] as const;',
      'export const payload = { msg: "hi", res: 1 };',
      'export const text = payload.msg;',
      'export class Counter {',
      '  private count = 0;',
      '  public constructor(private readonly start: number) {}',
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
    const findings = await findingsFor({ config: base, code });
    assert.equal(findings.length, 1);
    assert.match(findings[0].message, /Unused eslint-disable directive/);
  });

  it('allows require() in a CommonJS file', async () => {
    const code = 'const path = require("node:path");\nmodule.exports = path.sep;';
    assert.deepEqual(await ruleIdsFor({ config: node, code, filePath: 'config.cjs' }), []);
  });
});

describe('node ESLint config', () => {
  it('leaves accessibility modifiers to TypeScript files', async () => {
    const code = 'export class Counter { increment() { return 1; } }';
    assert.deepEqual(await ruleIdsFor({ config: node, code, filePath: 'bin/tool.js' }), []);
  });

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
    assert.ok(ruleIds.includes('no-restricted-syntax'));
  });
});
