import { Application, NextFunction, Request, Response } from 'express';
import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { UserBasicAccessInfo } from '../../types/user-by-court';
import { Logger } from '@hmcts/nodejs-logging';
import { requiresAuth } from 'express-openid-connect';
import { RequiresSuperUser } from '../../middleware/admin-middleware';
import {PutUserAccessRequest} from "../../services/pre-api/types";

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

      let xUserId = await SessionUser.getLoggedInUserBrowseId(req);

      try {
        const client = new PreClient();
        const courtMap: Map<string, string> = await client.getCourtIdsAndNames(xUserId);

        const selectedCourtId = typeof req.query.courtId === 'string' ? req.query.courtId.trim() : '';
        const selectedCourtName = selectedCourtId ? (courtMap.get(selectedCourtId) ?? '') : '';

        const courtList = Array.from(courtMap, ([id, name]) => ({ id, name }));

        // logger.info('Court list fetched for offboarding page', {
        //   courtCount: courtList.length,
        //   selectedCourtId,
        // });

        let userList: UserBasicAccessInfo[] = [];

        if (selectedCourtId) {
          userList = await client.getUsersByCourt(xUserId, selectedCourtId);
        }

        const roles = await client.getRoles(xUserId);

        if (!roles || roles.length === 0) {
          logger.error('No roles found', { xUserId });
          res.status(400).send('No roles found');
          return;
        }

        const courtLevelRoles = roles.filter(role => role.name === 'Level 2'
          || role.name === 'Level 1' || role.name === 'Level 4');

        res.render('users/offboarding.njk', {
          users: userList,
          roles: courtLevelRoles,
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

  app.post(
    '/user-admin/offboarding',
    requiresAuth(),
    RequiresSuperUser,
    async (req: Request, res: Response, next: NextFunction) => {
      const logger = Logger.getLogger('update-user-access-route');

      const isSuperUser: boolean = SessionUser.isLoggedInSuperUser(req);
      if (!isSuperUser) {
        res.status(404);
        res.render('utility/not-found', {
          isSuperUser: false,
        });
        return;
      }

      const userId = typeof req.body.userId === 'string' ? req.body.userId.trim() : '';
      const courtId = typeof req.body.courtId === 'string' ? req.body.courtId.trim() : '';
      const roleId = typeof req.body.roleId === 'string' ? req.body.roleId.trim() : '';

      const requestingUserId = await SessionUser.getLoggedInUserBrowseId(req);

      try {
        const client = new PreClient();

        const accessRequest: PutUserAccessRequest = {
          user_id: userId,
          role_id: roleId,
          court_id: courtId,
          active: req.body.active
        };

        logger.info('Received request to update user access', {
          accessRequest,
        });

        if (!accessRequest.user_id || !accessRequest.court_id || !accessRequest.role_id ) {
          logger.error('Missing required fields in user access update request', { accessRequest });
          res.status(400).send('Missing required fields');
          return;
        }

        await client.putUserAccess(requestingUserId, accessRequest);

        logger.info("Successfully updated user access", { accessRequest });

        res.redirect('/user-admin/offboarding' + (courtId ? `?courtId=${encodeURIComponent(courtId)}` : ''));
        return;
      } catch (error) {
        logger.error('Error updating user access', { error });
        next(error);
      }
    }
  );
}
