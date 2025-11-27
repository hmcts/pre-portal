import { describe, expect, test, vi, beforeAll } from 'vitest';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { LiveEventStatusService } from '../../../main/services/system-status/live-events-status';
import { mockeduser } from '../test-helper';
import { UserLevel } from '../../../main/types/user-level';

vi.mock('express-openid-connect', () => {
  return {
    requiresAuth: vi.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        next();
      };
    }),
  };
});

vi.mock('../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: vi.fn().mockImplementation(() => '123'),
      getLoggedInUserProfile: vi.fn().mockImplementation(() => mockeduser),
    },
  };
});

vi.mock('../../../main/services/system-status/live-events-status');

describe('MK Live Events route', () => {
  beforeAll(() => {
    vi.resetAllMocks();
  });

  test('should display live events page for super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const mkLiveEvents = require('../../../main/routes/admin/mk-live-events').default;
    mkLiveEvents(app);

    LiveEventStatusService.prototype.getMediaKindLiveEventStatuses = jest.fn().mockResolvedValue([
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
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const mkLiveEvents = require('../../../main/routes/admin/mk-live-events').default;
    mkLiveEvents(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/mk-live-events');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
