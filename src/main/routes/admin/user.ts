import { Application } from 'express';
import { SessionUser } from '../../services/session-user/session-user';
import { PreClient } from '../../services/pre-api/pre-client';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

export default (app: Application): void => {
  app.get('/admin/users/:id', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();
    const userPortalId = await SessionUser.getLoggedInUserPortalId(req);

    const user = await client.getUser(userPortalId, req.params.id);
    if (!user) {
      res.status(404);
      res.render('not-found');
      return;
    }

    res.render('admin/user', {
      user,
      pageUrl: req.url,
      isSuperUser: true,
      hasAppAccess: user.app_access.length > 0,
      hasPortalAccess: user.portal_access.length > 0,
    });
  });
};
