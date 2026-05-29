module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [],
  rules: {
    // Only the inspection rules
    'complexity': ['error', 10],
    'max-lines-per-function': ['error', 50],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-loop-func': 'error',
  },
};
