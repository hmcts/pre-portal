import { config as testConfig } from './src/test/config';
import { setHeadlessWhen } from '@codeceptjs/configure';

setHeadlessWhen(testConfig.TestHeadlessBrowser);
export const config: CodeceptJS.MainConfig = {
  name: 'functional',
  gherkin: testConfig.Gherkin,
  output: './functional-output/functional/reports',
  helpers: testConfig.helpers,
  tests: './*_test.{js,ts}',
  plugins: {
    pause: {
      enabled: !testConfig.TestHeadlessBrowser,
    },
    retryFailedStep: {
      enabled: true,
    },
    retry: 3,
    screenshot: {
      enabled: true,
      fullPageScreenshots: true,
    },
  },
};
