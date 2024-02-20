// eslint.config.js
const antfu = require('@antfu/eslint-config').default
const globals = require('globals')

module.exports = antfu(
  {},
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    rules: {
      'ts/consistent-type-imports': 0,
      'unused-imports/no-unused-vars': 0,
      'new-cap': 0,
      'no-console': 0,
      'no-empty': 0,
      'no-new-func': 0,
      'no-useless-call': 0,
    },
  },
)
