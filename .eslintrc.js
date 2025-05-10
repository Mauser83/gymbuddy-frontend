module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    'react-native/react-native': true,
  },
  plugins: [
    'react',
    'react-native',
    '@typescript-eslint',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    'react/prop-types': 'off',
    'react/display-name': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};