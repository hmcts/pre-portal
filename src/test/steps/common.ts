import { config } from '../config';

const { I } = inject();

export const iAmOnPage = (text: string): void => {
  const url = new URL(text, config.TEST_URL);
  I.retry({ retries: 3, maxTimeout: 5000 }).amOnPage(url.toString());
};
Given('I go to {string}', iAmOnPage);

Then('the page URL should be {string}', (url: string) => {
  I.retry({ retries: 3, maxTimeout: 5000 }).waitInUrl(url);
});

Then('the page should include {string}', (text: string) => {
  I.waitForText(text);
});

Then('the page title should include {string}', (text: string) => {
  I.seeInTitle(text);
});

Then('I am on the {string} page', (path: string) => {
  const url = new URL(path, config.TEST_URL);
  I.amOnPage(url.toString());
});

Then('I sign in as the test user', () => {
  I.fillField('Email Address', config.b2c.testLogin.email as string);
  I.fillField('Password', config.b2c.testLogin.password as string);
  I.click('Sign in');

  // handle dodgy B2C login where bounces back to login form 1 time...sometimes.
  I.grabCurrentUrl().then(url => {
    if (url.includes('/authorize')) {
      I.fillField('Email Address', config.b2c.testLogin.email as string);
      I.fillField('Password', config.b2c.testLogin.password as string);
      I.click('Sign in');
    }
  });
});

Then('I accept the terms and conditions if I need to', async () => {
  const url = await I.grabCurrentUrl();
  if (url.includes('/accept-terms-and-conditions')) {
    I.checkOption('#terms');
    I.click('Continue');
  }
});

Then('I see the link {string}', (text: string) => {
  I.seeElement(locate('a').withText(text));
});

Then('I sign in as an unknown user', () => {
  I.fillField('Email Address', config.b2c.testLogin.email as string);
  I.fillField('Password', 'this is not the password');
  I.click('Sign in');

  // handle dodgy B2C login where bounces back to login form 1 time...sometimes.
  I.grabCurrentUrl().then(url => {
    if (url.includes('/authorize')) {
      I.fillField('Email Address', config.b2c.testLogin.email as string);
      I.fillField('Password', 'this is not the password');
      I.click('Sign in');
    }
  });
});
