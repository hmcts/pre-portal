import { PreClient } from '../services/pre-api/pre-client';
import { SessionUser } from '../services/session-user/session-user';

import { Application } from 'express';

export default function (app: Application): void {
  app.get('/accept-terms-and-conditions', (req, res) => {
    res.render('accept-terms-and-conditions');
  });

  app.post('/accept-terms-and-conditions', async (req, res) => {
    const terms = req.body.terms === 'accept';

    if (terms) {
      const client = new PreClient();
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
      await client.acceptTermsAndConditions(userPortalId);
    }

    res.redirect('/browse');
  });
}
