import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function readRepoFile(path) {
  return readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
}

const workflow = readRepoFile('.github/workflows/linear-ticket.yml');

function readRunScript(yaml) {
  const lines = yaml.split('\n');
  const runLines = lines.filter((line) => line.trim() === 'run: |');
  assert.equal(runLines.length, 1, 'the workflow has exactly one run script');
  const start = lines.indexOf(runLines[0]);
  const runIndent = lines[start].indexOf('run:');
  const body = [];
  for (const line of lines.slice(start + 1)) {
    const leavesRunBlock = line.trim() !== '' && line.search(/\S/) <= runIndent;
    if (leavesRunBlock) {
      break;
    }
    body.push(line);
  }
  const indent = Math.min(...body.filter((line) => line.trim()).map((line) => line.search(/\S/)));
  return body.map((line) => line.slice(indent)).join('\n');
}

const script = readRunScript(workflow);

function run({ title, authorType = 'User', team = 'YAN' }) {
  try {
    const stdout = execFileSync('bash', ['-c', script], {
      env: { PATH: process.env.PATH, TITLE: title, AUTHOR_TYPE: authorType, TEAM: team },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, stdout: error.stdout };
  }
}

function passes(options) {
  return run(options).ok;
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

  it('fails an event with no pull request title', () => {
    assert.equal(passes({ title: '' }), false);
  });

  it('lets a bot-authored PR through', () => {
    assert.ok(passes({ title: 'chore(deps): bump prettier', authorType: 'Bot' }));
  });

  it("passes GitHub's revert of a ticketed PR, not of an unticketed one", () => {
    assert.ok(passes({ title: 'Revert "feat(YAN-12): add the check"' }));
    assert.equal(passes({ title: 'Revert "docs(rules): add a rule"' }), false);
    assert.equal(passes({ title: 'Revert "feat(YAN-12): x" and more' }), false);
  });

  it('checks the team key passed in', () => {
    assert.ok(passes({ title: 'feat(ABC-12): other team', team: 'ABC' }));
    assert.equal(passes({ title: 'feat(YAN-12): default team', team: 'ABC' }), false);
  });

  it('rejects a team key that would loosen the pattern', () => {
    assert.equal(passes({ title: 'feat(-1): no team', team: '' }), false);
    assert.equal(passes({ title: 'feat(B-1): either team', team: 'A|B' }), false);
  });

  it('keeps the title out of the workflow command', () => {
    const { ok, stdout } = run({ title: 'wip %0A::add-mask::x' });
    assert.equal(ok, false);
    const command = stdout.split('\n').find((line) => line.startsWith('::error'));
    assert.ok(command && !command.includes('wip'), command);
  });

  it('wires the script to the pull request and the team-key input', () => {
    assert.match(workflow, /TITLE: \$\{\{ github\.event\.pull_request\.title \}\}/);
    assert.match(workflow, /AUTHOR_TYPE: \$\{\{ github\.event\.pull_request\.user\.type \}\}/);
    assert.match(workflow, /TEAM: \$\{\{ inputs\.team-key \}\}/);
    assert.match(workflow, /if: github\.event_name != 'merge_group'\n/);
  });

  it("documents the same caller as this repo's own", () => {
    const caller = readRepoFile('.github/workflows/pr-title.yml').replace(
      './.github/workflows/linear-ticket.yml',
      'yaniv120892/dev-config/.github/workflows/linear-ticket.yml@v',
    );
    const readme = readRepoFile('README.md').replace(/(linear-ticket\.yml@v)[\d.]+/, '$1');
    assert.ok(readme.includes(caller), 'README caller snippet matches pr-title.yml');
  });
});
