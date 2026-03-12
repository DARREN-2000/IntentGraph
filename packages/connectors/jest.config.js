/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@intentgraph/workflow-spec$': '<rootDir>/../workflow-spec/src/index',
    '^@intentgraph/action-sdk$': '<rootDir>/../action-sdk/src/index',
    '^@intentgraph/connectors$': '<rootDir>/src/index',
    '^@intentgraph/policy$': '<rootDir>/../policy/src/index',
  },
};
