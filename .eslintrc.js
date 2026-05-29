module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [],
  rules: {
    'linebreak-style': 'off',
    'no-console': 'off',
    'consistent-return': 'warn',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-underscore-dangle': 'off',
    'func-names': 'off',
    'object-shorthand': 'warn',
    'prefer-destructuring': 'warn',
    'no-param-reassign': [
      'error',
      {
        props: false,
      },
    ],
    camelcase: [
      'warn',
      {
        properties: 'never',
        ignoreDestructuring: true,
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
    'max-len': [
      'warn',
      {
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: true,
        variables: true,
      },
    ],
    'prefer-const': 'warn',
    'arrow-body-style': 'warn',
    'prefer-arrow-callback': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'lib/',
    'tempFiles/',
    '*.test.js',
  ],
};
