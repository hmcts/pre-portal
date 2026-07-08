import { Application } from 'express';
import { PreClient } from '../../services/pre-api/pre-client';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

import { LiveEventStatusService } from '../../services/system-status/live-events-status';

export default function (app: Application): void {
  app.get('/admin/mk-live-events', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();

    const liveEventService = new LiveEventStatusService(req, client);
    const liveEvents = await liveEventService.getMediaKindLiveEventStatuses();

    res.render('admin/mk-live-events', {
      isSuperUser: true,
      liveEvents,
      request: req,
      pageUrl: req.url,
    });
  });
}
