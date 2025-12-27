import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.', // tetap di root project
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],

  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        diagnostics: false,
      },
    ],
  },

  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^utils/(.*)$': '<rootDir>/utils/$1',
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: false,
  coverageDirectory: 'coverage',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Jawara Backend Test Report',
        outputPath: './test-results/index.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: 'darkTheme',
        openReport: false,
      },
    ],
  ],
};

export default config;
