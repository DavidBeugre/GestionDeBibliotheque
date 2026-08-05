/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@repositories/(.*)$': '<rootDir>/repositories/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
  },
  clearMocks: true,
  collectCoverageFrom: ['**/*.ts', '!**/__tests__/**', '!server.ts'],
};
