import assert from 'node:assert/strict';
import { it } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import config from '../prettier/index.js';

it('formats with single quotes, trailing commas and a 100-column width', async () => {
  const longCall = `call("${'a'.repeat(40)}", "${'b'.repeat(40)}", "${'c'.repeat(10)}");`;
  const output = await format(`const list = ["a", "b"];\n${longCall}\n`, {
    ...config,
    parser: 'typescript',
  });
  assert.equal(
    output,
    [
      "const list = ['a', 'b'];",
      'call(',
      `  '${'a'.repeat(40)}',`,
      `  '${'b'.repeat(40)}',`,
      `  '${'c'.repeat(10)}',`,
      ');',
      '',
    ].join('\n'),
  );
});

it('keeps a call that fits in 100 columns on one line', async () => {
  const fits = `call('${'a'.repeat(40)}', '${'b'.repeat(40)}');\n`;
  assert.equal(await format(fits, { ...config, parser: 'typescript' }), fits);
});

it('leaves the code inside a Markdown fence as written', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dev-config-prettier-'));
  try {
    const configPath = join(directory, '.prettierrc.mjs');
    await writeFile(
      configPath,
      `export { default } from '${join(process.cwd(), 'prettier/index.js')}';\n`,
    );
    const readmePath = join(directory, 'README.md');
    const markdown = [
      '# Usage',
      '',
      '```ts',
      'test: { inline: ["@yaniv120892/my-ui"] }',
      '```',
      '',
    ].join('\n');
    const options = await resolveConfig(readmePath, { config: configPath });
    assert.equal(await format(markdown, { ...options, filepath: readmePath }), markdown);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
