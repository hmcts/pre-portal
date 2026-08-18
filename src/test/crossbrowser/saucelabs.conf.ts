import { config as testConfig } from '../config';
import supportedBrowsers from './supportedBrowsers';

const getBrowserConfig = browserGroup => {
  const browserConfig: any[] = [];

  for (const candidateBrowser in supportedBrowsers[browserGroup]) {
    if (candidateBrowser) {
      const candidateCapabilities = {
        ...supportedBrowsers[browserGroup][candidateBrowser],
      };

      browserConfig.push({
        browser: candidateCapabilities.browserName,
        capabilities: candidateCapabilities,
      });
    } else {
      console.error('ERROR: supportedBrowsers is empty or incorrectly defined');
    }
  }

  return browserConfig;
};

const setupConfig = {
  name: 'cross-browser',
  gherkin: {
    features: '../functional/features/**/browse.feature',
    steps: ['../steps/common.ts'],
  },
  output: '../../../functional-output/cross-browser/reports',
  helpers: testConfig.helpers,
  tests: './*_test.{js,ts}',
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 3,
    },
    allure: {
      enabled: true,
    },
    screenshot: {
      enabled: true,
      fullPageScreenshots: true,
    },
  },
  multiple: {
    webkit: {
      browsers: getBrowserConfig('webkit'),
    },
    chromium: {
      browsers: getBrowserConfig('chromium'),
    },
    firefox: {
      browsers: getBrowserConfig('firefox'),
    },
  },
};

export const config = setupConfig;
