import { PreClient } from '../services/pre-api/pre-client';
import { SessionUser } from '../services/session-user/session-user';

import { Application } from 'express';

export default function (app: Application): void {
  app.get('/accept-terms-and-conditions', async (req, res) => {
    const client = new PreClient();
    const terms = await client.getLatestTermsAndConditions();

    res.render('accept-terms-and-conditions', {
      terms: terms.html,
      termsId: terms.id,
    });
  });

  app.post('/accept-terms-and-conditions', async (req, res) => {
    const terms = req.body.terms === 'accept';
    const termsId = req.body.termsId;

    if (terms) {
      const client = new PreClient();
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
      await client.acceptTermsAndConditions(userPortalId, termsId);
    }

    res.redirect('/browse');
  });
}
