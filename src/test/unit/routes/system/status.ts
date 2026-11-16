import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi, beforeAll } from 'vitest';
import { Nunjucks } from '../../../../main/modules/nunjucks';
import { mockeduser } from '../../test-helper';
import { UserLevel } from '../../../../main/types/user-level';

vi.mock('express-openid-connect', () => ({
  default: {
    requiresAuth: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next())
  },
}));


vi.mock('../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    getLoggedInUserPortalId: vi.fn().mockReturnValue('123'),
    getLoggedInUserProfile: vi.fn().mockReturnValue(mockeduser),
  },
}));

vi.mock('../../../main/services/system-status/system-status');

const registerRoute = async (app: express.Express) => {
  const { default: adminStatus } = await import('../../../../main/routes/system/status');
  adminStatus(app);
};

describe('Admin Status route', () => {
  beforeAll(() => {
    vi.resetAllMocks();
  });

  test('should display status page for super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    await registerRoute(app);
    const response = await request(app).get('/system/status');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Admin');
    expect(response.text).toContain('Status');
    expect(response.text).toContain('Audit');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/system/status');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
