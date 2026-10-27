export default {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      // A README fence often holds a fragment, which the code formatter rewrites into invalid code.
      files: '*.md',
      options: { embeddedLanguageFormatting: 'off' },
    },
  ],
};
