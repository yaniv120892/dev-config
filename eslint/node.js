import globals from 'globals';
import base from './index.js';

export default [
  ...base,
  {
    name: 'dev-config/node',
    languageOptions: { globals: globals.node },
  },
];
