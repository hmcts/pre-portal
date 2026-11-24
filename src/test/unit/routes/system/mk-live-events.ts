vi.mock('express-openid-connect', () => ({
  requiresAuth: vi.fn(() => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.oidc = {
      user: { email: 'test@test.com' },
    } as typeof req.oidc;
    next();
  }),
}));

vi.mock('../../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    getLoggedInUserPortalId: vi.fn().mockReturnValue('123'),
    getLoggedInUserBrowseId: vi.fn().mockReturnValue('super-user-access-id'),
    getLoggedInUserProfile: vi.fn().mockImplementation(() => mockeduser),
    getSuperUserId: vi
      .fn()
      .mockImplementation(
        () => mockeduser.app_access?.find(access => access.active && access.role.name === UserLevel.SUPER_USER)?.id
      ),
    isLoggedInSuperUser: vi
      .fn()
      .mockImplementation(() =>
        mockeduser.app_access?.find(access => access.active && access.role.name === UserLevel.SUPER_USER)
      ),
  },
}));

import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { Nunjucks } from '../../../../main/modules/nunjucks';
import { LiveEventStatusService } from '../../../../main/services/system-status/live-events-status';
import { mockeduser } from '../../test-helper';
import { UserLevel } from '../../../../main/types/user-level';

const registerRoute = async (app: express.Express) => {
  const { default: mkLiveEvents } = await import('../../../../main/routes/system/mk-live-events');
  mkLiveEvents(app);
};

describe('MK Live Events route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should display live events page for super user', async () => {
    vi.spyOn(LiveEventStatusService.prototype, 'getMediaKindLiveEventStatuses').mockResolvedValue([
      {
        id: '123',
        name: 'MK',
        description: 'MK Live Event',
        status: 'Live',
        caseReference: 'ABC123',
      },
    ]);

    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/system/mk-live-events');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Live Events');
    expect(response.text).toContain('MK');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/system/mk-live-events');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
