import { SearchAuditLogsRequest } from '../../services/pre-api/types';
import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { RequiresSuperUser } from '../../middleware/admin-middleware';
import { UserLevel } from '../../types/user-level';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { getAllPaginatedCourts } from '../../helpers/helpers';
import { Logger } from '@hmcts/nodejs-logging';

export default function audits(app: Application): void {
  app.get('/management/audit', requiresAuth(), RequiresSuperUser, async (req, res) => {
    const client = new PreClient();
    const logger = Logger.getLogger('audits');

    try {
      const request: SearchAuditLogsRequest = {
        after: req.query.after as string,
        before: req.query.before as string,
        functionalArea: req.query.functionalArea as string,
        source: req.query.source as string,
        userName: req.query.userName as string,
        courtId: req.query.courtId as string,
        caseReference: req.query.caseReference as string,
        page: req.query.page as unknown as number,
        size: 10,
      };

      const userPortalId = SessionUser.getLoggedInUserProfile(req).app_access.filter(
        role => role.role.name === UserLevel.SUPER_USER
      )?.[0].id;

      const { auditLogs, pagination } = await client.getAuditLogs(userPortalId, request);
      const { paginationLinks, title } = client.createPagination(
        pagination,
        'management/audit',
        'Audit Logs',
        auditLogs.length
      );

      const courts = await getAllPaginatedCourts(client, userPortalId, { size: 50 });

      res.render('management/audits', {
        auditLogs,
        paginationLinks,
        title,
        pageUrl: req.url,
        isSuperUser: true,
        params: req.query,
        courts: courts.map(court => {
          return {
            id: court.id,
            name: court.name,
          };
        }),
      });
    } catch (err) {
      logger.error(err.message);
      res.status(404);
      res.render('utility/not-found', {
        isSuperUser: true,
        pageUrl: req.url,
      });
      return;
    }
  });
}
