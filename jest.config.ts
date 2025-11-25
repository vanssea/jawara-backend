import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.', // tetap di root project
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: false,
  coverageDirectory: 'coverage',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
    },
  },
};

export default config;
