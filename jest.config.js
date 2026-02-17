import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export const coveragePathIgnorePatterns = ['src/prisma/generated'];
export const coverageDirectory = '../coverage';
export const testEnvironment = 'node';
export const transform = {
  ...tsJestTransformCfg,
};
export const moduleNameMapper = {
  '^src/(.*)$': '<rootDir>/$1',
};
export const rootDir = 'src';
export const projects = [
  {
    moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
    displayName: 'unit',
    coveragePathIgnorePatterns: ['src/prisma/generated'],
    testMatch: ['<rootDir>/**/*.spec.ts', '!<rootDir>/test/*.e2e-spec.ts'],
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
  },
  {
    moduleNameMapper: { '^src/(.*)$': '<rootDir>/$1' },
    coveragePathIgnorePatterns: ['src/prisma/generated'],
    displayName: 'integration',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    testMatch: ['<rootDir>/test/*.e2e-spec.ts'],
    rootDir: 'src',
  },
];
