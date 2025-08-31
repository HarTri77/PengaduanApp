module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    // App globals
    CONFIG: 'readonly',
    Utils: 'readonly',
    Storage: 'readonly',
    Navigation: 'readonly',
    Profile: 'readonly',
    Reports: 'readonly',
    Rating: 'readonly',
    Modal: 'readonly',
    PengaduanApp: 'readonly',
    App: 'writable'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    
    // Best practices
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'eqeqeq': 'error',
    'curly': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // Modern JS
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'no-var': 'error',
    
    // Potential errors
    'no-undef': 'error',
    'no-unreachable': 'error',
    'valid-typeof': 'error',
    
    // DOM specific
    'no-global-assign': 'error',
    'no-implicit-globals': 'error'
  }
};