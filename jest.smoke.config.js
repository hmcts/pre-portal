module.exports = {
  roots: ['<rootDir>/src/test/smoke'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.[cm]?jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
  moduleNameMapper: {
    '^router/(.*)$': '<rootDir>/src/main/router/$1',
    '^routes/(.*)$': '<rootDir>/src/main/routes/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Smoke Test Report',
        outputPath: '<rootDir>/smoke-output/reports/test-report.html',
        includeFailureMsg: true,
      },
    ],
  ],
};
