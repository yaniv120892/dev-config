import reactHooks from 'eslint-plugin-react-hooks';
import base from './index.js';

export default [
  ...base,
  {
    ...reactHooks.configs.flat.recommended,
    name: 'dev-config/react',
    files: ['**/*.{jsx,tsx}', '**/use*.{js,ts}'],
  },
];
