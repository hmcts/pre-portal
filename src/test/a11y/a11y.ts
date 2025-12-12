/*
This file remains on Puppeteer because Pa11y is not compatible with Playwright and one test is too complex
to convert whole file to Pa11y actions.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '../config';

import { isFlagEnabled } from '../../main/utils/helpers';

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

async function signIn(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(config.TEST_URL as string, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#signInName', { visible: true, timeout: 30000 });
  await page.type('#signInName', process.env.B2C_TEST_LOGIN_EMAIL as string);
  await page.type('#password', process.env.B2C_TEST_LOGIN_PASSWORD as string);
  await page.click('#next');
  return page;
}

jest.setTimeout(15000);
async function signInSuperUser(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(config.TEST_URL as string, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#signInName', { visible: true, timeout: 30000 });
  await page.type('#signInName', process.env.B2C_TEST_SUPER_USER_LOGIN_EMAIL as string);
  await page.type('#password', process.env.B2C_TEST_SUPER_USER_LOGIN_PASSWORD as string);
  await page.click('#next');
  return page;
}

jest.setTimeout(65000);
const screenshotDir = `${__dirname}/../../../functional-output/pa11y`;

describe('Accessibility', () => {
  const signedOutUrls = ['/accessibility-statement', '/cookies', '/not-found', '/'];

  describe.each(signedOutUrls)('Signed out page %s', url => {
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

    test('admin/status page should have no accessibility errors', async () => {
      const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await signInSuperUser(browser);
      await page.waitForSelector('a[href^="/admin/status"]', { visible: true, timeout: 30000 });
      //await page.click('a[href^="/admin/status"]');
      await page.goto(config.TEST_URL + '/admin/status');

      const result: Pa11yResult = await pa11y(page.url(), {
        browser: browser,
        screenCapture: `${screenshotDir}/admin-status.png`,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });

      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
      await browser.close();
    }, 65000);

    test('admin/MK-live-events page should have no accessibility errors', async () => {
      const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await signInSuperUser(browser);
      await page.waitForSelector('a[href^="/admin/status"]', { visible: true, timeout: 30000 });
      await page.click('a[href^="/admin/status"]');
      await page.goto(config.TEST_URL + '/admin/MK-live-events');
      const liveEventsUrl = page.url();
      const liveEventsResult: Pa11yResult = await pa11y(liveEventsUrl, {
        browser: browser,
        screenCapture: `${screenshotDir}/admin-live-events.png`,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });

      expect(liveEventsResult.issues).toEqual(expect.any(Array));
      expectNoErrors(liveEventsResult.issues);
      await browser.close();
    }, 65000);

    test('/edit-request/:id page', async () => {
      if (!isFlagEnabled('pre.enableAutomatedEditing')) {
        return;
      }

      const page = await signIn(browser);
      await page.waitForSelector('a[href^="/edit-request/"]', { visible: true, timeout: 0 });

      if (page.url().includes('/accept-terms-and-conditions')) {
        await page.click('input#terms');
        await page.click('button[type="submit"]');
        await page.waitForSelector('a[href^="/watch/"]', { visible: true, timeout: 0 });
      }
      try {
        await page.click('a[href^="/edit-request/"]:not([href$="/view"])');
      } catch (e) {
        console.error('Error: No editable requests found');
        return;
      }
      const editUrl = page.url();

      const result: Pa11yResult = await pa11y(editUrl, {
        browser,
        screenCapture: `${screenshotDir}/edit-request.png`,
        waitUntil: 'domcontentloaded',
      });
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
    }, 65000);

    test('/edit-request/:id/view page (for submissions)', async () => {
      if (!isFlagEnabled('pre.enableAutomatedEditing')) {
        return;
      }
      const page = await signIn(browser);
      await page.waitForSelector('a[href^="/edit-request/"]', { visible: true, timeout: 0 });

      if (page.url().includes('/accept-terms-and-conditions')) {
        await page.click('input#terms');
        await page.click('button[type="submit"]');
        await page.waitForSelector('a[href^="/watch/"]', { visible: true, timeout: 0 });
      }
      try {
        await page.click('a[href^="/edit-request/"]:not([href$="/view"])');
      } catch (e) {
        console.error('Error: No editable requests found');
        return;
      }
      await page.waitForSelector('button[id^="submit-button"]', { visible: true, timeout: 0 });
      await page.click('button[id^="submit-button"]');
      const submitViewUrl = page.url();
      const result: Pa11yResult = await pa11y(submitViewUrl, {
        browser,
        screenCapture: `${screenshotDir}/edit-request-view-submit.png`,
        waitUntil: 'domcontentloaded',
      });
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
    }, 65000);

    test('/edit-request/:id/view page (for viewing)', async () => {
      if (!isFlagEnabled('pre.enableAutomatedEditing')) {
        return;
      }
      const page = await signIn(browser);
      await page.waitForSelector('a[href^="/edit-request/"]', { visible: true, timeout: 0 });

      if (page.url().includes('/accept-terms-and-conditions')) {
        await page.click('input#terms');
        await page.click('button[type="submit"]');
        await page.waitForSelector('a[href^="/watch/"]', { visible: true, timeout: 0 });
      }
      try {
        await page.click('a[href^="/edit-request/"][href$="/view"]');
      } catch (e) {
        console.error('Error: No viewable edit requests found');
        return;
      }
      const viewUrl = page.url();
      const result: Pa11yResult = await pa11y(viewUrl, {
        browser,
        screenCapture: `${screenshotDir}/edit-request-view.png`,
        waitUntil: 'domcontentloaded',
      });
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
    }, 65000);

    test('/browse, watch, and terms pages', async () => {
      const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await signIn(browser);
      await page.waitForSelector('a[href^="/watch/"],input#terms', { visible: true, timeout: 30000 });

      if (page.url().includes('/accept-terms-and-conditions')) {
        await page.click('input#terms');
        await page.click('button[type="submit"]');
        await page.waitForSelector('a[href^="/watch/"]', { visible: true, timeout: 30000 });
      }
      const browseUrl = page.url();
      await page.click('a[href^="/watch/"]');
      const watchUrl = page.url();

      await page.goto(config.TEST_URL + '/terms-and-conditions');
      const termsUrl = page.url();
      await page.close();

      const result: Pa11yResult = await pa11y(browseUrl, {
        browser: browser,
        screenCapture: `${screenshotDir}/browse.png`,
        waitUntil: 'domcontentloaded',
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });
      expect(result.issues.map(issue => issue.code)).toEqual([]);

      const watchResult: Pa11yResult = await pa11y(watchUrl, {
        browser: browser,
        screenCapture: `${screenshotDir}/watch.png`,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });

      expect(watchResult.issues.map(issue => issue.code)).toEqual([]);

      const termsResult: Pa11yResult = await pa11y(termsUrl, {
        browser: browser,
        screenCapture: `${screenshotDir}/terms.png`,
        ignore: ['WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4'],
      });
      expect(termsResult.issues.map(issue => issue.code)).toEqual([]);

      await browser.close();
    }, 65000);
  });
});
