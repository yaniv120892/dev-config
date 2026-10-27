# dev-config

One set of lint, format, TypeScript and CI conventions for all my repos. Each repo consumes it
instead of carrying its own copy.

| Export                                                 | What it is                                            |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `@yaniv120892/dev-config/eslint`                       | ESLint flat config: JS + TypeScript, my code rules    |
| `@yaniv120892/dev-config/eslint/node`                  | The base plus Node globals                            |
| `@yaniv120892/dev-config/eslint/next`                  | The base plus `eslint-config-next/core-web-vitals`    |
| `@yaniv120892/dev-config/prettier`                     | Single quotes, width 100, trailing commas             |
| `@yaniv120892/dev-config/lint-staged`                  | `eslint --fix` + `prettier --write` on staged files   |
| `@yaniv120892/dev-config/tsconfig/{preset}`            | `base`, `node`, `next`, `library`                     |
| `yaniv120892/dev-config/.github/workflows/node-ci.yml` | Reusable CI job: format, lint, typecheck, test, build |

## Install

```bash
npm install -D github:yaniv120892/dev-config#v0.1.0 eslint prettier typescript husky lint-staged
```

A Next.js app also needs `eslint-config-next` at the version matching its `next`.

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
    uses: yaniv120892/dev-config/.github/workflows/node-ci.yml@v0.1.0
```

Inputs: `node-version` (default `22`), `audit` (default `false`), `build-node-options`. A job
that needs a database or a browser stays a separate job in the repo, calling the same scripts.

## Rules

Every rule is an error. The non-default ones enforce my code conventions:

- Braces on every `if`/loop body (`curly`).
- `type`, never `interface`; `T[]`, never `Array<T>`; `import type` for types.
- No `as` casts (`as const` is allowed) and no `!` non-null assertions.
- `public`/`private`/`protected` on every class member.
- No abbreviated identifiers (`cfg`, `ctx`, `req`, `res`, `msg`, …).
- `async`/`await`, never `.then()` chains.
- `switch` needs a `default`; loops keep their stop condition in the header.
- An `eslint-disable` needs a `-- reason`, and an unused one is an error.

## Release

1. Bump `version` in `package.json` in the same PR as the change. Vercel caches a git dependency
   by version, so a same-version change never reaches a deployed app.
2. After the squash-merge, tag the merge commit: `gh release create v<version> --generate-notes`.
3. Consumers bump the tag in both `package.json` and their CI `uses:` line.
