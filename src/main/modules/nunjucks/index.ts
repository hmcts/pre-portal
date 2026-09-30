import * as path from 'path';

import * as express from 'express';
import * as nunjucks from 'nunjucks';
import { Logger } from '@hmcts/nodejs-logging';

export class Nunjucks {
  constructor(public developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  private logger = Logger.getLogger('Nunjucks');

  enableFor(app: express.Express): void {
    console.time('startup:nunjucks');
    this.logger.info('Enabling Nunjucks');
    app.set('view engine', 'njk');
    nunjucks
      .configure(path.join(__dirname, '..', '..', 'views'), {
        autoescape: true,
        watch: this.developmentMode,
        express: app,
      })
      .addGlobal('govukRebrand', true)
      .addFilter('formatDate', (date: string) => {
        return new Date(date).toLocaleDateString('en-GB');
      })
      .addFilter('formatDateTime', (date: string) => {
        return !!date ? new Date(date).toLocaleString('en-GB', { timeZone: 'Europe/London' }).replace(',', '') : '';
      });

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      next();
    });
    this.logger.info('Nunjucks enabled');
    console.timeEnd('startup:nunjucks');
  }
}
