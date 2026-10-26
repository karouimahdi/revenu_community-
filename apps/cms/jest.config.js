module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  testTimeout: 90000,
  // compileStrapi() recompiles the shared dist/ dir on boot — unsafe to run
  // two test files concurrently, so this keeps any future ones serial.
  maxWorkers: 1,
};
