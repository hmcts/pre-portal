import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

export default function (app: Application): void {
  app.get('/admin', requiresAuth(), RequiresSuperUser, async (req, res) => {
    res.redirect('admin/edit-request');
  });
}
