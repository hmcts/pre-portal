import { UserLevel } from '../types/user-level';
import { SessionUser } from '../services/session-user/session-user';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';

export default function (app: Application): void {
  app.get('/admin', requiresAuth(), async (req, res) => {
    const userRole = SessionUser.getLoggedInUserProfile(req).app_access[0]?.role.name;
    if (userRole === UserLevel.SUPER_USER) {
      res.render('admin');
    } else {
      res.status(404);
      res.render('not-found');
    }
  });
}
