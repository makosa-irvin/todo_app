/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // bootstrap only (createApp().listen()); exercised implicitly
    '!src/models/*.ts', // by every integration test starting the real app, but no
  ], // test imports it directly. models/*.ts is types only, nothing to cover.
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};

// tests/unit      — fast, isolated (TodoStore)
// tests/integration — full app via supertest, real HTTP round-trip
