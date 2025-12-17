import * as path from 'path';

import * as express from 'express';
import * as nunjucks from 'nunjucks';
import { SessionUser } from '../../services/session-user/session-user';

export class Nunjucks {
  constructor(public developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  enableFor(app: express.Express): void {
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
        return !!date ? new Date(date).toLocaleString('en-GB').replace(',', '') : '';
      });

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      
      try {
        if (req['__session'] && req['__session'].userProfile) {
          const userProfile = SessionUser.getLoggedInUserProfile(req);
          const currentEmail = userProfile.user.email.toLowerCase();
          const isCjsmEmail = currentEmail.endsWith('@cjsm.net');
          
          res.locals.showCjsmBanner = !isCjsmEmail;
        } else {
          res.locals.showCjsmBanner = false;
        }
      } catch (error) {
        res.locals.showCjsmBanner = false;
      }
      
      next();
    });
  }
}
