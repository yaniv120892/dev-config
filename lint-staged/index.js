export default {
  '*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,md,css,scss,yml,yaml,html}': 'prettier --write',
};
