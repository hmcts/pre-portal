import { Application } from 'express';
import {
  convertAppAccessResponseToRequest,
  convertUserResponseToUserRequest,
  getAllPaginatedCourts,
  isFlagEnabled,
  isSuperUser,
  validateId,
} from '../../helpers/helpers';
import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { requiresAuth } from 'express-openid-connect';
import { PutAppAccessRequest, PutPortalAccessRequest, PutUserRequest } from '../../services/pre-api/types';
import { AccessStatus } from '../../types/access-status';
import { v4 as uuid } from 'uuid';
import { Role } from '../../types/user-profile';

const REGEX_EMAIL =
  /^[a-zA-Z0-9._%+-]+@(justice\.gov\.uk|hmcts\.net|ejudiciary\.net|cps\.gov\.uk|[a-zA-Z0-9._%+-]+\.cjsm\.net)$/g;
const REGEX_PHONE = /^\+?[0-9]{10,15}$/g;

const Roles = {
  'Super User': 0,
  'Level 1': 1,
  'Level 2': 2,
  'Level 3': 3,
  'Level 4': 4,
};

export const validateRequest = (request: PutUserRequest, roles: Role[]): Record<string, string> => {
  let errors = {};
  const firstName = request.first_name;
  if (!firstName || firstName.length < 2 || firstName.length > 100) {
    errors['first_name'] = 'Enter first name';
  }

  const lastName = request.last_name;
  if (!lastName || lastName.length < 2 || lastName.length > 100) {
    errors['last_name'] = 'Enter last name';
  }

  const email = request.email;
  if (!email || !email.match(REGEX_EMAIL)) {
    errors['email'] =
      'Enter email with one of the following domains: justice.gov.uk, hmcts.net, ejudiciary.net, cps.gov.uk, *.cjsm.net';
  }

  const isPortalUser = request.portal_access.length > 0;
  const phone = request.phone;

  if ((isPortalUser || phone) && (!phone || !phone?.match(REGEX_PHONE))) {
    errors['phone'] = 'Enter phone number. It is required for users with portal access';
  }

  const org = request.organisation;
  if ((isPortalUser || org) && (!org || org.length < 2 || org.length > 100)) {
    errors['organisation'] = 'Enter organisation. It is required for users with portal access';
  }

  if (request.app_access.length !== 0) {
    if (request.app_access.length !== new Set(request.app_access.map(access => access.court_id)).size) {
      errors['app_access_court_id'] = 'Court must be unique for each app access';
    }
    if (request.app_access.some(access => !access.role_id)) {
      errors['app_access_role_id'] = 'Level must be selected for each app access';
    }
    if (request.app_access.filter(access => access.default_court).length !== 1) {
      errors['app_access_default_court'] = 'Must have one default (primary) court';
    } else {
      if (!errors['app_access_role_id']) {
        const primaryRoleId = request.app_access.filter(access => access.default_court)[0].role_id;
        const primaryRole = Roles[roles.filter(role => role.id === primaryRoleId)[0].name];
        request.app_access.forEach(access => {
          if (access.role_id === primaryRoleId) {
            if (primaryRole === undefined) {
              errors['app_access_default_court_role'] = 'Primary court must have the highest role level';
            }
            return;
          }
          const otherRole = Roles[roles.filter(role => role.id === access.role_id)[0].name];
          if (otherRole === undefined || otherRole < primaryRole) {
            errors['app_access_default_court_role'] = 'Primary court must have the highest role level';
          }
        });
      }
    }
  }

  return errors;
};

export default (app: Application): void => {
  if (!isFlagEnabled('pre.enableAdminApp')) {
    return;
  }

  app.get('/admin/users/new/edit', requiresAuth(), async (req, res) => {
    if (!isSuperUser(req)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    const client = new PreClient();
    let userPortalId: string;
    try {
      userPortalId = await SessionUser.getLoggedInUserPortalId(req);
    } catch (e) {
      res.status(404);
      res.render('not-found');
      return;
    }

    res.render('admin/put-users', {
      isUpdate: false,
      postUrl: '/admin/users/submit',
      hasAppAccess: false,
      hasPortalAccess: false,
      courts: await getAllPaginatedCourts(client, userPortalId, { size: 50 }),
      roles: await client.getRoles(userPortalId),
    });
  });

  app.get('/admin/users/:id/edit', requiresAuth(), async (req, res) => {
    if (!validateId(req.params.id) || !isSuperUser(req)) {
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

    res.render('admin/put-users', {
      user,
      isUpdate: true,
      postUrl: '/admin/users/submit',
      hasAppAccess: user.app_access.length > 0,
      hasPortalAccess: user.portal_access.length > 0,
      courts: await getAllPaginatedCourts(client, userPortalId, { size: 50 }),
      roles: await client.getRoles(userPortalId),
    });
  });

  app.post('/admin/users/submit', requiresAuth(), async (req, res) => {
    if (!(validateId(req.body.id) || req.body.id === '') || !isSuperUser(req)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    const client = new PreClient();
    const userPortalId = await SessionUser.getLoggedInUserPortalId(req);

    let user;

    if (req.body.id !== '') {
      user = await client.getUser(userPortalId, req.body.id);
    }

    const currentAppAccess = user?.app_access ?? [];
    let request = {
      ...(user ? convertUserResponseToUserRequest(user) : {}),
      ...(req.body as PutUserRequest),
    } as PutUserRequest;

    if (req.body.id === '') {
      request.id = uuid();
    }

    if (req.body.app_access.length > 0) {
      request.app_access = req.body.app_access.map((access: PutAppAccessRequest): PutAppAccessRequest => {
        const existingAccess = currentAppAccess.find((current: PutAppAccessRequest) => current.id === access.id);
        if (existingAccess) {
          return {
            ...convertAppAccessResponseToRequest(existingAccess, request.id),
            ...access,
          };
        } else {
          return {
            ...access,
            id: uuid(),
            user_id: request.id,
          };
        }
      });
    }

    if (!req.body.hasPortalAccess) {
      request.portal_access = [];
    }

    if (req.body.hasPortalAccess === 'true' && user?.portal_access.length === 0) {
      request.portal_access = [
        {
          id: uuid(),
          user_id: request.id,
          status: AccessStatus.INVITATION_SENT,
          invited_at: new Date().toISOString(),
        } as PutPortalAccessRequest,
      ];
    }

    const errors = validateRequest(request, await client.getRoles(userPortalId));
    if (Object.entries(errors).length > 0) {
      res.status(400);
      res.json({ errors });
      return;
    }

    try {
      await client.putUser(userPortalId, request);
    } catch (e) {
      res.status(400);
      res.json({ errors: { general: 'Something went wrong' } });
      return;
    }

    res.redirect('/admin/users/' + request.id);
  });
};
