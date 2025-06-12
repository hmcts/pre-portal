import { UserLevel } from '../types/user-level';
import { SessionUser } from '../services/session-user/session-user';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';

export default function (app: Application): void {
  app.get('/admin', requiresAuth(), async (req, res) => {
    const isSuperUser =
      SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)
        .length > 0;
    if (isSuperUser) {
      res.render('admin', {
        isSuperUser: isSuperUser,
      });
    } else {
      res.status(404);
      res.render('not-found');
    }
  });
}
