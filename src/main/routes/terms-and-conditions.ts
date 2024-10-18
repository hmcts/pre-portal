import { PreClient } from '../services/pre-api/pre-client';

import { Application } from 'express';

export default function (app: Application): void {
  app.get('/terms-and-conditions', async (req, res) => {
    const client = new PreClient();
    const terms = await client.getLatestTermsAndConditions();

    res.render('terms-and-conditions', {
      terms: terms.html,
    });
  });
}
