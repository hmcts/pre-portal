import { PreClient } from '../../services/pre-api/pre-client';

import { Application } from 'express';

import { marked } from 'marked';

export default function termsAndConditions(app: Application): void {
  app.get('/terms-and-conditions', async (req, res) => {
    const client = new PreClient();
    const terms = await client.getLatestTermsAndConditions();

    res.render('utility/terms-and-conditions', {
      terms: marked(terms.html),
    });
  });
}
