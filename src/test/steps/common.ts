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

Then('I sign in with valid credentials as the test user', () => {
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

Then('I sign in with valid credentials as a super user', () => {
  I.fillField('Email Address', config.b2c.testSuperUserLogin.email as string);
  I.fillField('Password', config.b2c.testSuperUserLogin.password as string);
  I.click('Sign in');

  I.grabCurrentUrl().then(url => {
    if (url.includes('/authorize')) {
      I.fillField('Email Address', config.b2c.testSuperUserLogin.email as string);
      I.fillField('Password', config.b2c.testSuperUserLogin.password as string);
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

Then('I do not see the link {string}', async (text: string) => {
  I.dontSeeElement(locate('a').withText(text));
});

Then('I click the link {string}', (text: string) => {
  I.click(locate('a').withText(text));
});

Then('I enter a valid email address', () => {
  I.fillField('Email Address', config.b2c.testLogin.email as string);
  I.click('Send verification code');
});

Then('I sign in with an unknown user', () => {
  I.fillField('Email Address', 'email@hmcts.net');
  I.fillField('Password', 'this is a password');
  I.click('Sign in');
});

Then('I sign in with the wrong password', () => {
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
