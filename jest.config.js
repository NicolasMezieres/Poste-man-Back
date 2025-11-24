import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export const rootDir = '.';
export const coverageDirectory = '../coverage/';
export const coveragePathIgnorePatterns = [
  'src/prisma/generated',
  'node_modules',
];
export const testEnvironment = 'node';
export const transform = {
  ...tsJestTransformCfg,
};
export const moduleNameMapper = {
  '^src/(.*)$': '<rootDir>/src/$1',
  '^prisma/(.*)$': '<rootDir>/prisma/$1',
};
