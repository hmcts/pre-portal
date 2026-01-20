/*
This file remains on Puppeteer because Pa11y is not compatible with Playwright and one test is too complex
to convert whole file to Pa11y actions.
 */

import puppeteer, {Browser, Page} from 'puppeteer';
import {config} from '../config';

import {isFlagEnabled} from '../../main/utils/helpers';

const pa11y = require('pa11y');

interface Pa11yResult {
  documentTitle: string;
  pageUrl: string;
  issues: PallyIssue[];
}

interface PallyIssue {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
}

function expectNoErrors(messages: PallyIssue[]): void {
  const errors = messages.filter(m => m.type === 'error');

  if (errors.length > 0) {
    const errorsAsJson = `${JSON.stringify(errors, null, 2)}`;
    throw new Error(`There are accessibility issues: \n${errorsAsJson}\n`);
  }
}

async function signInAsNormalUser(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(config.TEST_URL as string, {waitUntil: 'networkidle2'});
  await page.waitForSelector('#signInName', {visible: true, timeout: 30000});
  await page.type('#signInName', process.env.B2C_TEST_LOGIN_EMAIL as string);
  await page.type('#password', process.env.B2C_TEST_LOGIN_PASSWORD as string);
  await page.click('#next');
  await page.waitForSelector('a[href^="/logout"]', {visible: true, timeout: 30000});

  if (page.url().includes('/accept-terms-and-conditions')) {
    await page.click('input#terms');
    await page.click('button[type="submit"]');
    await page.waitForSelector('a[href^="/watch/"]', { visible: true, timeout: 0 });
  }
  return page;
}

jest.setTimeout(15000);

async function signInSuperUserAndAcceptTCs(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(config.TEST_URL as string, {waitUntil: 'networkidle2'});
  await page.waitForSelector('#signInName', {visible: true, timeout: 30000});
  await page.type('#signInName', process.env.B2C_TEST_SUPER_USER_LOGIN_EMAIL as string);
  await page.type('#password', process.env.B2C_TEST_SUPER_USER_LOGIN_PASSWORD as string);
  await page.click('#next');
  await page.waitForSelector('a[href^="/admin/edit-request"]', {visible: true, timeout: 30000});
  if (page.url().includes('/accept-terms-and-conditions')) {
    await page.click('input#terms');
    await page.click('button[type="submit"]');
    await page.waitForSelector('a[href^="/watch/"]', {visible: true, timeout: 0});
  }
  return page;
}

jest.setTimeout(65000);
const screenshotDir = `${__dirname}/../../../functional-output/pa11y`;

describe('Accessibility', () => {
  const signedOutUrls = ['/accessibility-statement', '/cookies', '/not-found', '/'];
  const signedInAsAdminUrls = ['/admin/edit-request', '/admin/status', '/admin/MK-live-events',
    '/admin/audit', '/admin/migration'];
  const signedInAsNormalUserUrls = ['/edit-request', '/watch', '/browse', '/terms-and-conditions'];

  let browser: Browser;

  beforeEach(async () => {
    browser = await puppeteer.launch({
      acceptInsecureCerts: true,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterEach(async () => {
    await browser.close();
  });

  describe.each(signedOutUrls)('Signed out page %s', url => {
    test('should have no accessibility errors', async () => {
      const result: Pa11yResult = await pa11y(config.TEST_URL + url.replace('//', '/'), {
        screenCapture: `${screenshotDir}/${url}.png`,
        browser: browser,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
    });
  });

  describe.each(signedInAsAdminUrls)('Signed in as super user: page %s', url => {
    test('should have no accessibility errors', async () => {
      const page = await signInSuperUserAndAcceptTCs(browser);
      await page.click('a[href^="/admin/edit-request');
      const result: Pa11yResult = await pa11y(config.TEST_URL + url.replace('//', '/'), {
        screenCapture: `${screenshotDir}/${url}.png`,
        browser: browser,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
      await browser.close();
    }, 65000);
  });

  describe.each(signedInAsNormalUserUrls)('Signed in as normal user: page %s', url => {
    test('should have no accessibility errors', async () => {
      const page = await signInAsNormalUser(browser);

      const result: Pa11yResult = await pa11y(config.TEST_URL + page.url().replace('//', '/'), {
        screenCapture: `${screenshotDir}/${url}.png`,
        browser: browser,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });

      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
      await browser.close();
    }, 65000);
  });

  test('/edit-request/:id page', async () => {
    if (!isFlagEnabled('pre.enableAutomatedEditing')) {
      return;
    }

    const page = await signInAsNormalUser(browser);

    try {
      await page.click('a[href^="/edit-request/"]:not([href$="/view"])');
    } catch (e) {
      console.error('Error: No editable requests found for user ' + process.env.B2C_TEST_LOGIN_EMAIL);
      throw e;
    }
    const editUrl = page.url();

    const result: Pa11yResult = await pa11y(editUrl, {
      browser,
      screenCapture: `${screenshotDir}/edit-request.png`,
      waitUntil: 'domcontentloaded',
      ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
    });
    expect(result.issues).toEqual(expect.any(Array));
    expectNoErrors(result.issues);

    await page.waitForSelector('button[id^="submit-button"]', {visible: true, timeout: 0});
    await page.click('button[id^="submit-button"]');
    const submitViewUrl = page.url();
    const submitResult: Pa11yResult = await pa11y(submitViewUrl, {
      browser,
      screenCapture: `${screenshotDir}/edit-request-view-submit.png`,
      waitUntil: 'domcontentloaded',
      ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
    });

    expect(submitResult.issues).toEqual(expect.any(Array));
    expectNoErrors(submitResult.issues);

    try {
      await page.click('a[href^="/edit-request/"][href$="/view"]');
    } catch (e) {
      console.error('Error: No viewable edit requests found');
      throw e;
    }
    const viewUrl = page.url();
    const viewResult: Pa11yResult = await pa11y(viewUrl, {
      browser,
      screenCapture: `${screenshotDir}/edit-request-view.png`,
      waitUntil: 'domcontentloaded',
      ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
    });
    expect(viewResult.issues).toEqual(expect.any(Array));
    expectNoErrors(viewResult.issues);

  }, 65000);

});
