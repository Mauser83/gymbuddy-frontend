/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  root: true,
  env: { es2021: true, node: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    sourceType: 'module',
    project: false,
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': { typescript: {} },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    // ⬇️ use "recommended" instead of "all" (WAY quieter)
    'plugin:react-native/all',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  rules: {
    // Keep Prettier strict (formatting must pass)
    'prettier/prettier': 'error',

    // Pragmatic TS hygiene
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    '@typescript-eslint/no-explicit-any': 'off',

    // RN: turn off the two noisiest rules for existing apps
    'react-native/no-raw-text': 'off',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',

    // Import order is nice, but start with a warning (autofix available)
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
      },
    ],

    // React niceties
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['*.cjs', '*.config.js', 'app.config.*'],
      parserOptions: { sourceType: 'script' },
    },
  ],
};
