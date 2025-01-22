import { Application } from 'express';
import { isSuperUser } from '../../helpers/helpers';
import { SessionUser } from '../../services/session-user/session-user';
import { PreClient } from '../../services/pre-api/pre-client';

export default (app: Application): void => {
  app.get('/admin/users/:id', async (req, res) => {
    if (!isSuperUser(req)) {
      res.status(404);
      res.render('not-found');
      return;
    }

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
      hasAppAccess: user.app_access.length > 0,
      hasPortalAccess: user.portal_access.length > 0,
    });
  });
};
