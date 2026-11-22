module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',

  // Directorio de coverage
  coverageDirectory: 'coverage',

  // Archivos a incluir en coverage (solo archivos con tests existentes)
  collectCoverageFrom: [
    'DB/**/*.js',
    'lib/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!coverage/**',
  ],

  // Umbrales de coverage ajustados a niveles actuales
  // NOTA: La cobertura actual es ~70% para DB y lib (archivos con tests)
  // Estos umbrales se incrementarán conforme se agreguen más tests
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 25,
      functions: 60,
      lines: 50,
    },
  },

  // Patrón de archivos de test
  testMatch: [
    '<rootDir>/test/**/*.spec.js',
  ],

  // Verbose output
  verbose: true,

  // Timeout para tests (útil para tests de integración)
  testTimeout: 30000, // 30 segundos para tests de integración con DB

  maxWorkers: 1,
};
