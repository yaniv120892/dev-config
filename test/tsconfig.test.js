import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';

const packageRoot = resolve(import.meta.dirname, '..');
const tsc = join(packageRoot, 'node_modules', '.bin', 'tsc');

function effectiveOptionsOf(preset) {
  const consumer = mkdtempSync(join(tmpdir(), 'dev-config-'));
  mkdirSync(join(consumer, 'node_modules', '@yaniv120892'), { recursive: true });
  symlinkSync(packageRoot, join(consumer, 'node_modules', '@yaniv120892', 'dev-config'));
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({ extends: `@yaniv120892/dev-config/tsconfig/${preset}.json`, files: [] }),
  );
  const output = execFileSync(tsc, ['--showConfig', '-p', consumer], { encoding: 'utf8' });
  return JSON.parse(output).compilerOptions;
}

describe('tsconfig presets resolve through the package exports', () => {
  for (const [preset, moduleResolution] of [
    ['node', 'nodenext'],
    ['next', 'bundler'],
    ['library', 'bundler'],
  ]) {
    it(`${preset} carries the strict base`, () => {
      const options = effectiveOptionsOf(preset);
      assert.equal(options.strict, true);
      assert.equal(options.noUncheckedIndexedAccess, true);
      assert.equal(options.noImplicitOverride, true);
      assert.equal(options.moduleResolution, moduleResolution);
    });
  }
});
