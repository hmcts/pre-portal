module.exports = {
  roots: ['<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!jose/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
