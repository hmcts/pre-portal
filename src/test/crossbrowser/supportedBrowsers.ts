const LATEST_MAC = 'macOS 10.15';
const LATEST_WINDOWS = 'Windows 10';

interface SauceOptions {
  name: string;
  screenResolution?: string;
}

interface BrowserConfig {
  browserName: string;
  platformName: string;
  browserVersion: string;
  'sauce:options': SauceOptions;
}

interface SupportedBrowsers {
  webkit: {
    webkit_mac_latest: BrowserConfig;
  };
  chromium: {
    chromium_win_latest: BrowserConfig;
    chromium_mac_latest: BrowserConfig;
  };
  firefox: {
    firefox_win_latest: BrowserConfig;
    firefox_mac_latest: BrowserConfig;
  };
}

const supportedBrowsers: SupportedBrowsers = {
  webkit: {
    webkit_mac_latest: {
      browserName: 'webkit',
      platformName: LATEST_MAC,
      browserVersion: 'latest',
      'sauce:options': {
        name: 'Mac_webkit_latest',
        screenResolution: '1400x1050',
      },
    },
  },
  chromium: {
    chromium_win_latest: {
      browserName: 'chromium',
      platformName: LATEST_WINDOWS,
      browserVersion: 'latest',
      'sauce:options': {
        name: 'Win_chromium_latest',
      },
    },
    chromium_mac_latest: {
      browserName: 'chromium',
      platformName: LATEST_MAC,
      browserVersion: 'latest',
      'sauce:options': {
        name: 'Mac_chromium_latest',
      },
    },
  },
  firefox: {
    firefox_win_latest: {
      browserName: 'firefox',
      platformName: LATEST_WINDOWS,
      browserVersion: 'latest',
      'sauce:options': {
        name: 'Win_Firefox_latest',
      },
    },
    firefox_mac_latest: {
      browserName: 'firefox',
      platformName: LATEST_MAC,
      browserVersion: 'latest',
      'sauce:options': {
        name: 'Mac_Firefox_latest',
      },
    },
  },
};

export default supportedBrowsers;
