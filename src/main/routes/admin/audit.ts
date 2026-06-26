import { RequiresSuperUser } from '../../middleware/admin-middleware';
import { PreClient } from '../../services/pre-api/pre-client';
import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { SessionUser } from '../../services/session-user/session-user';
import { UserLevel } from '../../types/user-level';

function validateId(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export default function (app: Application): void {
  app.get('/admin/audit/:id', requiresAuth(), RequiresSuperUser, async (req, res) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
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
        res.render('not-found');
        return;
      }

      res.render('admin/audit', {
        audit,
        pageUrl: req.url,
        isSuperUser: true,
      });
    } catch (err) {
      res.status(404);
      res.render('not-found');
      return;
    }
  });
}
