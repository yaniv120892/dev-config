import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/linear-ticket.yml', import.meta.url),
  'utf8',
);

function readRunScript(yaml) {
  const lines = yaml.split('\n');
  const start = lines.findIndex((line) => line.trim() === 'run: |');
  const runIndent = lines[start].indexOf('run:');
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== '' && line.search(/\S/) <= runIndent) {
      break;
    }
    body.push(line);
  }
  const indent = Math.min(...body.filter((line) => line.trim()).map((line) => line.search(/\S/)));
  return body.map((line) => line.slice(indent)).join('\n');
}

const script = readRunScript(workflow);

function passes({ title, authorType = 'User' }) {
  try {
    execFileSync('bash', ['-c', script], {
      env: { PATH: process.env.PATH, TITLE: title, AUTHOR_TYPE: authorType, TEAM: 'YAN' },
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

describe('linear-ticket workflow', () => {
  it('passes a conventional title scoped to a ticket', () => {
    assert.ok(passes({ title: 'feat(YAN-137): add the ticket check' }));
    assert.ok(passes({ title: 'fix(YAN-1)!: drop the old endpoint' }));
  });

  it('fails a title without a ticket in the scope', () => {
    for (const title of ['docs(rules): add a rule', 'feat: no scope', 'wip YAN-12 fix']) {
      assert.equal(passes({ title }), false, title);
    }
  });

  it('fails a malformed ticket or type', () => {
    for (const title of [
      'feat(YAN-0): zero',
      'feat(yan-12): lower case',
      'Feat(YAN-12): capital type',
      'feat(YAN-12):no space',
      'feat(ABC-12): other team',
    ]) {
      assert.equal(passes({ title }), false, title);
    }
  });

  it('treats the title as data, not shell', () => {
    assert.ok(passes({ title: 'feat(YAN-1): $(exit 1)' }));
    assert.equal(passes({ title: 'docs(x): `exit 0`' }), false);
  });

  it('lets a bot-authored PR through', () => {
    assert.ok(passes({ title: 'chore(deps): bump prettier', authorType: 'Bot' }));
  });
});
