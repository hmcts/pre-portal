import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { RequiresSuperUser } from '../../middleware/admin-middleware';
import { UserLevel } from '../../types/user-level';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { validateId } from '../../helpers/helpers';

export default function (app: Application): void {
  app.get('/management/audit/:id', requiresAuth(), RequiresSuperUser, async (req, res) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('utility/not-found');
      return;
    }

    const client = new PreClient();

    try {
      const audit = await client.getAudit(
        SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)?.[0]
          .id,
        req.params.id as string
      );

      if (!audit) {
        res.status(404);
        res.render('utility/not-found');
        return;
      }

      res.render('management/audit', {
        audit,
        pageUrl: req.url,
        isSuperUser: true,
      });
    } catch (err) {
      res.status(404);
      res.render('utility/not-found', {
        pageUrl: req.url,
        isSuperUser: true,
      });
      return;
    }
  });
}
