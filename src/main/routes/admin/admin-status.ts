import { Application } from 'express';
import { PreClient } from '../../services/pre-api/pre-client';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';
import { SystemStatus } from '../../services/system-status/system-status';

export default function (app: Application): void {
  app.get('/admin/status', requiresAuth(), RequiresSuperUser, async (req, res) => {
    try {
      const client = new PreClient();
      const systemStatus = new SystemStatus(client, app);

      const status = await systemStatus.getStatus();

      res.render('admin/status', {
        isSuperUser: true,
        status,
        request: req,
        pageUrl: req.url,
      });
    } catch (error) {
      console.error('Error fetching system status:', error);
      res.status(500).send('Error fetching system status');
    }
  });
}
