export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { document: 'readonly', window: 'readonly' },
    },
    plugins: {},
    rules: {
      'no-unused-vars': 'warn',
    },
  },
];
