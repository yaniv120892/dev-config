import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { promisify } from 'node:util';

const packageRoot = resolve(import.meta.dirname, '..');
const tsc = join(packageRoot, 'node_modules', '.bin', 'tsc');
const presets = [
  ['node', 'nodenext'],
  ['next', 'bundler'],
  ['library', 'bundler'],
];

describe('tsconfig presets resolve through the package exports', () => {
  const consumer = mkdtempSync(join(tmpdir(), 'dev-config-'));
  const effectiveOptions = new Map();

  before(async () => {
    mkdirSync(join(consumer, 'node_modules', '@yaniv120892'), { recursive: true });
    symlinkSync(packageRoot, join(consumer, 'node_modules', '@yaniv120892', 'dev-config'));
    await Promise.all(
      presets.map(async ([preset]) => {
        const project = join(consumer, `tsconfig.${preset}.json`);
        writeFileSync(
          project,
          JSON.stringify({ extends: `@yaniv120892/dev-config/tsconfig/${preset}.json`, files: [] }),
        );
        const { stdout } = await promisify(execFile)(tsc, ['--showConfig', '-p', project]);
        effectiveOptions.set(preset, JSON.parse(stdout).compilerOptions);
      }),
    );
  });

  after(() => rmSync(consumer, { recursive: true, force: true }));

  for (const [preset, moduleResolution] of presets) {
    it(`${preset} carries the strict base`, () => {
      const options = effectiveOptions.get(preset);
      assert.equal(options.strict, true);
      assert.equal(options.noUncheckedIndexedAccess, true);
      assert.equal(options.noImplicitOverride, true);
      assert.equal(options.moduleResolution, moduleResolution);
    });
  }
});
