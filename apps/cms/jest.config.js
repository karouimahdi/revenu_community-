module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  testTimeout: 90000,
  // Every test file boots its own Strapi instance via compileStrapi(), which
  // recompiles the TS build into the shared dist/ dir — unsafe to run two of
  // those concurrently (confirmed: corrupted a running dev server in Phase 2).
  // One worker keeps any future additional test file's boot strictly serial.
  maxWorkers: 1,
};
