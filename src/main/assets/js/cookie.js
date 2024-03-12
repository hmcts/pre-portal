import cookieManager from '@hmcts/cookie-manager';

cookieManager.on('UserPreferencesLoaded', preferences => {
  const dataLayer = window.dataLayer || [];
  dataLayer.push({ event: 'Cookie Preferences', cookiePreferences: preferences });
});

cookieManager.on('UserPreferencesSaved', preferences => {
  const dataLayer = window.dataLayer || [];
  const dtrum = window.dtrum;

  dataLayer.push({ event: 'Cookie Preferences', cookiePreferences: preferences });

  if (dtrum !== undefined) {
    if (preferences.apm === 'on') {
      dtrum.enable();
      dtrum.enableSessionReplay();
    } else {
      dtrum.disableSessionReplay();
      dtrum.disable();
    }
  }
});

cookieManager.on('PreferenceFormSubmitted', () => {
  const message = document.querySelector('.cookie-preference-success');
  if (message) {
    message.style.display = 'block';
  }
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
});

cookieManager.init({
  userPreferences: {
    cookieName: 'pre-cookie-preferences',
  },
  cookieManifest: [
    {
      categoryName: 'essential',
      optional: false,
      cookies: ['__session', 'pre-cookie-preferences'],
    },
    {
      categoryName: 'apm',
      cookies: ['dtCookie', 'dtLatC', 'dtPC', 'dtSa', 'rxVisitor', 'rxvt'],
    },
  ],
});
