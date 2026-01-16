import { config } from '../config';

const { I } = inject();

export const iAmOnPage = (text: string): void => {
  const url = new URL(text, config.TEST_URL);
  I.retry({ retries: 3, maxTimeout: 5000 }).amOnPage(url.toString());
};
Given('I go to {string}', iAmOnPage);

Then('the page should include {string}', (text: string) => {
  I.waitForFunction(
    text => document.body?.textContent?.includes(text) || false,
    [text], // Wrap text in an array
    10000 // Timeout in milliseconds
  );
});

Then('the page title should include {string}', (text: string) => {
  I.seeInTitle(text);
});

When('I am on the {string} page', (path: string) => {
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

Then('I see the text {string}', (text: string) => {
  I.see(text);
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

When('I click on play on a browse page', () => {
  I.click('Play');
  I.see('Please note playback is preferred on non-mobile devices. If possible, please use a preferred device');
});

When('I play the recording', () => {
  I.wait(10); //needed as it takes time to load recording on page.
  I.waitForElement("//*[@aria-label='Play']");
  I.click('Play');
});

Then('recording is played', async () => {
  I.wait(15); //waiting for mediakind to generate streaming locator.
  const videoSelector = '.bmpui-ui-playbacktimelabel';
  try {
    I.waitForElement(videoSelector, 5); // Fail the test if the element does not appear
    I.say('Playback time label is visible.');
  } catch (error) {
    throw new Error('Playback time label does not exist or is not visible.');
  }
  const initialTime = await I.grabTextFrom('.bmpui-ui-playbacktimelabel:nth-of-type(1)');
  I.wait(5);
  I.click('Play/Pause');
  const currentTime = await I.grabTextFrom('.bmpui-ui-playbacktimelabel:nth-of-type(2)');
  if (!currentTime.match(/^\d{2}:\d{2}$/)) {
    throw new Error(`Invalid playback time format: ${currentTime}`);
  }

  if (currentTime <= initialTime) {
    throw new Error('Video is not playing');
  }
  I.say('Video is playing successfully!');
});
