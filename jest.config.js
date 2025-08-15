module.exports = {
  roots: ['<rootDir>/src/test/unit', '<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  testEnvironment: 'node',
  // Use Babel so ESM deps get transpiled for Jest
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  // Transform deps in node_modules *and* .yarn/cache, but only for `jose`
  transformIgnorePatterns: ['/node_modules/(?!jose/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coveragePathIgnorePatterns: ['<rootDir>/src/main/modules/properties-volume/', '<rootDir>/src/main/assets/js/'],
  // If you only want to skip helper test files
  testPathIgnorePatterns: ['\\.helper\\.ts$'],
};
