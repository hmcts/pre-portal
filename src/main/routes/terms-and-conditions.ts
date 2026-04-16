import { PreClient } from '../services/pre-api/pre-client';

import { Application } from 'express';

import markdownit from 'markdown-it';

export default function (app: Application): void {
  app.get('/terms-and-conditions', async (req, res) => {
    const client = new PreClient();
    const terms = await client.getLatestTermsAndConditions();
    const md = markdownit();
    res.render('terms-and-conditions', {
      terms: md.render(terms.html),
    });
  });
}
