import { Application } from 'express';
import { PreClient } from '../../services/pre-api/pre-client';
import { CaptureSessionService } from '../../services/system-status/capture-sessions';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

export default function captureSessions(app: Application): void {
  app.get('/system/capture-sessions', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();

    const service = new CaptureSessionService(req, client);
    const captureSessions = await service.getCaptureSessionsForToday();

    res.render('system/capture-sessions', {
      isSuperUser: true,
      captureSessions,
      request: req,
      pageUrl: req.url,
    });
  });
}
