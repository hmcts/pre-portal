export default {
  preset: 'ts-jest/presets/default-esm',
  roots: ['<rootDir>/src/test/unit', '<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'ESNext',
          target: 'ES2020',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        useESM: true,
      },
    ],
    '^.+\\.[cm]?jsx?$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
  moduleNameMapper: {
    '^router/(.*)$': '<rootDir>/src/main/router/$1',
    '^routes/(.*)$': '<rootDir>/src/main/routes/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coveragePathIgnorePatterns: ['/src/main/modules/properties-volume/*', '/src/main/assets/js/*'],
  testPathIgnorePatterns: ['(^|/)[^/]*helper\\.ts$'],
};
