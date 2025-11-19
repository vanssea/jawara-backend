// jest-e2e.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  // fokuskan ke file e2e di src/test
  testMatch: ['<rootDir>/src/test/**/*.e2e-spec.ts', '<rootDir>/src/test/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 30000,
};

export default config;
