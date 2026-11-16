/// <reference types="codeceptjs" />

import { config as testConfig } from './src/test/config';

import { setHeadlessWhen } from '@codeceptjs/configure';

setHeadlessWhen(testConfig.TestHeadlessBrowser);

export const config: CodeceptJS.MainConfig = {
  name: 'functional',
  gherkin: testConfig.Gherkin,
  output: './functional-output/functional/reports',
  helpers: testConfig.helpers,
  tests: './*_test.{js,ts}',
  noGlobals: true,
  plugins: {
    pauseOnFail: {
      enabled: !testConfig.TestHeadlessBrowser,
    },
    retryFailedStep: {
      enabled: true,
    },
    retry: 3,
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
      fullPageScreenshots: true,
    },
  },

  require: ['tsx/esm'],
};
