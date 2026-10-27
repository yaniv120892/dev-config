import { createRequire } from 'node:module';
import { join } from 'node:path';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import base from './index.js';

// eslint-plugin-react's `detect` reads the version through context.getFilename, which ESLint 10
// removed, so the version is resolved here from the consuming repo instead.
function installedReactVersion() {
  try {
    return createRequire(join(process.cwd(), 'package.json'))('react/package.json').version;
  } catch {
    return '19';
  }
}

export default [
  ...nextCoreWebVitals,
  ...base,
  {
    name: 'dev-config/next',
    settings: { react: { version: installedReactVersion() } },
  },
];
