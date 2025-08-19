module.exports = {
  roots: ['<rootDir>/src/test/smoke'],
  testRegex: '(/src/test/.*|\\.test)\\.(ts|js)$',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: ['/node_modules/(?!jose/)'],
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
