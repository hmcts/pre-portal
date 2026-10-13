import { PreClient } from '../../services/pre-api/pre-client';

import { Application } from 'express';

import { marked } from 'marked';
import { SessionUser } from '../../services/session-user/session-user';
import { UserLevel } from '../../types/user-level';

export default function (app: Application): void {
  app.get('/terms-and-conditions', async (req, res) => {
    const client = new PreClient();
    const terms = await client.getLatestTermsAndConditions();

    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const isSuperUser = userProfileForCjsm.app_access.some(role => role.role.name === UserLevel.SUPER_USER);

    res.render('utility/terms-and-conditions', {
      terms: marked(terms.html),
      isSuperUser: isSuperUser,
      pageUrl: req.url,
    });
  });
}
