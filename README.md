# dev-config

One set of lint, format, TypeScript and CI conventions for all my repos. Each repo consumes it
instead of carrying its own copy.

| Export                                                       | What it is                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `@yaniv120892/dev-config/eslint`                             | ESLint flat config: JS + TypeScript, my code rules                |
| `@yaniv120892/dev-config/eslint/node`                        | The base plus Node globals                                        |
| `@yaniv120892/dev-config/eslint/next`                        | The base plus `eslint-config-next/core-web-vitals`                |
| `@yaniv120892/dev-config/eslint/react`                       | The base plus the React hooks rules, for a non-Next React package |
| `@yaniv120892/dev-config/prettier`                           | Prettier config                                                   |
| `@yaniv120892/dev-config/lint-staged`                        | lint-staged config for the pre-commit hook                        |
| `@yaniv120892/dev-config/tsconfig/{preset}`                  | `base`, `node`, `next`, `library`                                 |
| `yaniv120892/dev-config/.github/workflows/node-ci.yml`       | Reusable CI job: format, lint, typecheck, test, build             |
| `yaniv120892/dev-config/.github/workflows/linear-ticket.yml` | Reusable PR check: the title names a Linear ticket                |

## Install

```bash
npm install -D github:yaniv120892/dev-config#v0.1.7 eslint prettier typescript husky lint-staged
```

A Next.js app also needs `eslint-config-next` at the version matching its `next` (install
`eslint@10` first: the plugins it bundles still declare an `eslint ^9` peer, so a combined install
over an ESLint 9 lockfile fails with `ERESOLVE`); a React package using the `react` preset needs
`eslint-plugin-react-hooks`; a Node service extending `tsconfig/node.json` needs `@types/node`.

## Use

`eslint.config.mjs`:

```js
import { defineConfig } from 'eslint/config';
import next from '@yaniv120892/dev-config/eslint/next';

export default defineConfig([...next, { ignores: ['src/generated/**'] }]);
```

`package.json`:

```json
{
  "prettier": "@yaniv120892/dev-config/prettier",
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "next build",
    "prepare": "husky"
  }
}
```

`tsconfig.json` — `paths`, `include` and `exclude` stay in the repo, because TypeScript resolves
them against the file that declares them:

```json
{
  "extends": "@yaniv120892/dev-config/tsconfig/next.json",
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.mts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`.lintstagedrc.mjs` and `.husky/pre-commit`:

```js
export { default } from '@yaniv120892/dev-config/lint-staged';
```

```sh
npx lint-staged
```

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
permissions:
  contents: read
jobs:
  gate:
    uses: yaniv120892/dev-config/.github/workflows/node-ci.yml@v0.1.7
```

A job that needs a database or a browser stays a separate job in the repo, calling the same
scripts. The workflow's inputs are in `.github/workflows/node-ci.yml`.

### Linear ticket check

Every PR title is a conventional commit whose scope is a Linear ticket: `feat(YAN-123): …`.
Squash merges make the title the commit, so the ID also lands on `main`. Bot-authored PRs pass,
and so does GitHub's `Revert "<ticketed title>"`. Pass `team-key` for a team other than `YAN`.
Add `.github/workflows/linear-ticket.yml`:

```yaml
name: Linear ticket

on:
  pull_request:
    types: [opened, edited, reopened, synchronize]

concurrency:
  group: linear-ticket-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions: {}

jobs:
  linear-ticket:
    uses: yaniv120892/dev-config/.github/workflows/linear-ticket.yml@v0.1.7
```

`edited` reruns the check when only the title changes; `synchronize` puts it on each new head
commit, which a required check needs. The concurrency group cancels a run on a stale title, so
it cannot finish last and leave a red X. On a public repo, make it required in the branch ruleset:
the check is named `linear-ticket / PR title names a Linear ticket`, with GitHub Actions as its
source so another app cannot post a passing status under the same name. GitHub Free cannot
require checks on a private repo, so there it is a red X, not a block.

## Rules

`eslint/index.js` is the list. Its non-default rules enforce the code conventions in my Claude rules
(`~/.claude/rules/code.md`, `typescript.md`), so review comments about braces, casts, `interface`
or abbreviations become lint errors instead. CI runs lint with `--max-warnings=0`, so the rules
`eslint-config-next` leaves at `warn` fail the gate too.

A repo that sets its own `no-restricted-syntax` replaces ours, since rule options do not merge.
Spread ours back in:

```js
import base, { restrictedSyntax } from '@yaniv120892/dev-config/eslint';

export default [
  ...base,
  { rules: { 'no-restricted-syntax': ['error', ...restrictedSyntax, 'WithStatement'] } },
];
```

## Release

1. Bump `version` in `package.json` in the same PR as the change. Vercel caches a git dependency
   by version, so a same-version change never reaches a deployed app.
2. After the squash-merge, tag the merge commit: `gh release create v<version> --generate-notes`.
3. Consumers bump the tag in both `package.json` and their CI `uses:` line.
