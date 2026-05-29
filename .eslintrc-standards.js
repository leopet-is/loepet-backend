module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'airbnb-base',
    'plugin:import/recommended',
    'prettier',
  ],
  plugins: [
    'import',
  ],
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Disable inspection rules for standards-only
    'complexity': 'off',
    'max-lines-per-function': 'off',
    'no-eval': 'off',
    'no-implied-eval': 'off',
    'no-new-func': 'off',
    'no-script-url': 'off',
    'no-loop-func': 'off',
  },
};
