import assert from 'node:assert/strict';
import { it } from 'node:test';
import { format } from 'prettier';
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
