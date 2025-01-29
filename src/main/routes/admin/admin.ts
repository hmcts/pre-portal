import { UserLevel } from '../../types/user-level';
import { SessionUser } from '../../services/session-user/session-user';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { isFlagEnabled } from '../../helpers/helpers';

export default function (app: Application): void {
  if (!isFlagEnabled('pre.enableAdminApp')) {
    return;
  }

  app.get('/admin', requiresAuth(), async (req, res) => {
    const isSuperUser =
      SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)
        .length > 0;
    if (isSuperUser) {
      res.render('admin/admin', {
        isSuperUser,
        enableAdminApp: true,
      });
    } else {
      res.status(404);
      res.render('not-found');
    }
  });
}
