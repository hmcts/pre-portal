import { SearchAuditLogsRequest } from 'services/pre-api/types';
import { PreClient } from '../services/pre-api/pre-client';
import { SessionUser } from '../services/session-user/session-user';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { UserLevel } from '../types/user-level';

export default function (app: Application): void {
  app.get('/audit', requiresAuth(), async (req, res) => {
    const client = new PreClient();

    try {
      const request: SearchAuditLogsRequest = {
        page: req.query.page as unknown as number,
        size: 10,
      };

      const { auditLogs, pagination } = await client.getAuditLogs(
        SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)?.[0]
          .id,
        request
      );

      const { paginationLinks, title } = client.createPagination(pagination, 'audit', 'Audit Logs', auditLogs.length);

      res.render('audit', {
        auditLogs,
        paginationLinks,
        title,
      });
    } catch (err) {
      res.status(404);
      res.render('not-found');
      return;
    }
  });
}
