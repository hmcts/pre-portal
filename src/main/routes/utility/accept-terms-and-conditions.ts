import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';

import { Application } from 'express';

import { marked } from 'marked';
import { UserLevel } from '../../types/user-level';

export default function (app: Application): void {
  app.get('/accept-terms-and-conditions', async (req, res) => {
    const client = new PreClient();
    const terms = await client.getLatestTermsAndConditions();

    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const isSuperUser = userProfileForCjsm.app_access.some(role => role.role.name === UserLevel.SUPER_USER);

    res.render('utility/accept-terms-and-conditions', {
      terms: marked(terms.html),
      termsId: terms.id,
      isSuperUser: isSuperUser,
      pageUrl: req.url,
    });
  });

  app.post('/accept-terms-and-conditions', async (req, res) => {
    const terms = req.body.terms === 'accept';
    const termsId = req.body.termsId;

    if (!terms) {
      res.redirect('/accept-terms-and-conditions');
      return;
    }

    const client = new PreClient();
    const userProfile = await SessionUser.getLoggedInUserProfile(req);
    if (!userProfile.portal_access || userProfile.portal_access.length === 0) {
      throw new Error('User does not have access to the portal: ' + userProfile.user.email.substring(0, 5) + '...');
    }
    await client.acceptTermsAndConditions(userProfile.portal_access[0].id, termsId);

    res.redirect('/browse');
  });
}
