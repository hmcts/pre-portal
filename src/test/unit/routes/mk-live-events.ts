import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { LiveEventStatusService } from '../../../main/services/system-status/live-events-status';
import { mockeduser } from '../test-helper';
import { UserLevel } from '../../../main/types/user-level';
import { UserProfile } from '../../../main/types/user-profile';

let userProfile: UserProfile | undefined = mockeduser as UserProfile;

vi.mock('express-openid-connect', () => ({
  requiresAuth: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
}));

vi.mock('../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    getLoggedInUserPortalId: vi.fn().mockReturnValue('123'),
    getLoggedInUserProfile: vi.fn(() => userProfile),
  },
}));

const registerRoute = async (app: express.Express) => {
  const { default: mkLiveEvents } = await import('../../../main/routes/admin/mk-live-events');
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
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    vi.spyOn(LiveEventStatusService.prototype, 'getMediaKindLiveEventStatuses').mockResolvedValue([
      {
        id: '123',
        name: 'MK',
        description: 'MK Live Event',
        status: 'Live',
      },
    ]);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/admin/mk-live-events');
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

    const response = await request(app).get('/admin/mk-live-events');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
