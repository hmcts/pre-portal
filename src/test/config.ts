import { PropertiesVolume } from '../main/modules/properties-volume';
import { Application } from 'express';

import 'dotenv/config';

if (!process.env.TEST_PASSWORD) {
  new PropertiesVolume().enableFor({ locals: { developmentMode: true } } as unknown as Application);
}

// better handling of unhandled exceptions
process.on('unhandledRejection', reason => {
  throw reason;
});

import sysConfig from 'config';
export const config = {
  TEST_URL: process.env.TEST_URL || sysConfig.get('pre.portalUrl'),
  TestHeadlessBrowser: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  TestSlowMo: 250,
  WaitForTimeout: 10000,

  Gherkin: {
    features: './src/test/functional/features/**/*.feature',
    steps: ['./src/test/steps/common.ts'],
  },
  helpers: {},
  b2c: {
    testLogin: {
      email: sysConfig.get('b2c.testLogin.email'),
      password: sysConfig.get('b2c.testLogin.password'),
    },
    testSuperUserLogin: {
      email: sysConfig.get('b2c.testSuperUserLogin.email'),
      password: sysConfig.get('b2c.testSuperUserLogin.password'),
    },
  },
  session: {
    redis: {
      key: '',
      host: '',
    },
    maxAge: 86400000,
    secret: 'superlongrandomstringthatshouldbebetterinprod',
  },
};

config.helpers = {
  Playwright: {
    url: config.TEST_URL,
    show: !config.TestHeadlessBrowser,
    browser: 'chromium',
    channel: 'chrome',
    waitForTimeout: config.WaitForTimeout,
    waitForAction: 1000,
    waitForNavigation: 'networkidle0',
    ignoreHTTPSErrors: true,
    video: true,
    trace: true,
    keepVideoForPassedTests: true,
  },
};
