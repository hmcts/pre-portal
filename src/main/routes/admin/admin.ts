import { Application } from 'express';

import openidConnect from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

export default function admin(app: Application): void {
  app.get('/admin', openidConnect.requiresAuth(), RequiresSuperUser, async (req, res) => {
    res.redirect('system/status');
  });
}
