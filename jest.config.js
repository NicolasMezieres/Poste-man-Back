import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export const coverageDirectory = '../coverage/';
export const coveragePathIgnorePatterns = ['src/prisma/generated'];
export const testEnvironment = 'node';
export const transform = {
  ...tsJestTransformCfg,
};
export const moduleNameMapper = {
  '^src/(.*)$': '<rootDir>/$1',
};
export const rootDir = 'src';
