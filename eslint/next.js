import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import base from './index.js';

export default [
  ...nextCoreWebVitals,
  ...base,
  {
    name: 'dev-config/next',
    // eslint-plugin-react detects the version through context.getFilename,
    // which ESLint 10 removed; naming it skips the detection.
    settings: { react: { version: '19' } },
  },
];
