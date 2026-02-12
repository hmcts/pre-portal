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
  const login = config.b2c.testLogin;
  signIn(login.email as string, login.password as string);

  // handle dodgy B2C login where bounces back to login form 1 time...sometimes.
  I.grabCurrentUrl().then(url => {
    if (url.includes('/authorize')) {
      const login = config.b2c.testLogin;
      signIn(login.email as string, login.password as string);
    }
  });
});

Then('I sign in with valid credentials as a super user', () => {
  const login = config.b2c.testSuperUserLogin;
  signIn(login.email as string, login.password as string);

  I.grabCurrentUrl().then(url => {
    if (url.includes('/authorize')) {
      const login = config.b2c.testSuperUserLogin;
      signIn(login.email as string, login.password as string);
    }
  });
});

Then('I accept the terms and conditions if I need to', async () => {
  const url = await I.grabCurrentUrl();
  if (url.includes('/accept-terms-and-conditions')) {
    I.checkOption('#terms');
    clickWhenReady(acceptTermsContinueButton());
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
  clickWhenReady(link(text));
});

When('I open the navigation menu', async () => {
  clickWhenReady('#navToggle');
});

Then('I enter a valid email address', () => {
  const login = config.b2c.testLogin;
  sendVerifictionCode(login.email as string);
});

Then('I sign in with an unknown user', () => {
  signIn('email@hmcts.net', 'this is a password');
});

Then('I sign in with the wrong password', () => {
  const login = config.b2c.testLogin;
  signIn(login.email as string, 'this is not the password');

  // handle dodgy B2C login where bounces back to login form 1 time...sometimes.
  I.grabCurrentUrl().then(url => {
    if (url.includes('/authorize')) {
      signIn(login.email as string, 'this is not the password');
    }
  });
});

When('I click on play on a browse page', () => {
  clickWhenReady(playLink());
  I.see('Please note playback is preferred on non-mobile devices. If possible, please use a preferred device');
});

When('I play the recording', () => {
  I.wait(10); //needed as it takes time to load recording on page.
  clickWhenReady(videoPlayButton());
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
  clickWhenReady(playPauseButton());
  const currentTime = await I.grabTextFrom('.bmpui-ui-playbacktimelabel:nth-of-type(2)');
  if (!currentTime.match(/^\d{2}:\d{2}$/)) {
    throw new Error(`Invalid playback time format: ${currentTime}`);
  }

  if (currentTime <= initialTime) {
    throw new Error('Video is not playing');
  }
  I.say('Video is playing successfully!');
});

function signIn(emailAddress: string, password: string) {
  fillFieldWhenReady('signInName', emailAddress);
  fillFieldWhenReady('password', password);
  clickWhenReady(signInButton());
}

function sendVerifictionCode(emailAddress: string) {
  fillFieldWhenReady('email', emailAddress);
  clickWhenReady(sendVerificationCodeButton());
}

function fillFieldWhenReady(id: string, value: string, timeout = 5) {
  const locator = { id: id };
  I.waitForElement(locator, timeout);
  I.fillField(locator, value);
}

function clickWhenReady(locator: any, timeout = 10) {
  I.waitForElement(locator, timeout);
  I.waitForVisible(locator, timeout);
  I.click(locator);
}

function videoPlayButton() {
  return "//*[@aria-label='Play']";
}

function playPauseButton() {
  return locate('button').withText('Play/Pause');
}

function playLink() {
  return link('Play');
}

function signInButton() {
  return locate('button').withText('Sign in');
}

function sendVerificationCodeButton() {
  return locate('button').withText('Send verification code');
}

function acceptTermsContinueButton() {
  return locate('button').withText('Continue');
}

function link(text: string) {
  return locate('a').withText(text);
}
 