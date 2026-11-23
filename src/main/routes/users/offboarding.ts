import { Application, NextFunction, Request, Response } from 'express';
import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { UserBasicAccessInfo } from '../../types/user-by-court';
import { Logger } from '@hmcts/nodejs-logging';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';

export default function offboarding(app: Application): void {
  app.get(
    '/user-admin/offboarding',
    requiresAuth(),
    RequiresSuperUser,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger = Logger.getLogger('offboarding-route');

      const isSuperUser: boolean = SessionUser.isLoggedInSuperUser(req);
      if (!isSuperUser) {
        res.status(404);
        res.render('utility/not-found', {
          isSuperUser: false,
        });
        return;
      }

      const userId = await SessionUser.getLoggedInUserBrowseId(req);

      try {
        const client = new PreClient();
        const courtMap: Map<string, string> = await client.getCourtIdsAndNames(userId);

        const selectedCourtId = typeof req.query.courtId === 'string' ? req.query.courtId.trim() : '';
        const selectedCourtName = selectedCourtId ? (courtMap.get(selectedCourtId) ?? '') : '';

        const courtList = Array.from(courtMap, ([id, name]) => ({ id, name }));

        logger.info('Court list fetched for offboarding page', {
          courtCount: courtList.length,
          selectedCourtId,
        });

        let userList: UserBasicAccessInfo[] = [];

        if (selectedCourtId) {
          userList = await client.getUsersByCourt(await SessionUser.getLoggedInUserBrowseId(req), selectedCourtId);
        }

        res.render('users/offboarding.njk', {
          users: userList,
          courtList,
          selectedCourtId,
          selectedCourtName,
          isSuperUser: true,
          pageUrl: req.url,
        });
      } catch (error) {
        logger.error('Error loading offboarding page', { error });
        next(error);
      }
    }
  );
}
