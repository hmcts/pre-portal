import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi, beforeAll } from 'vitest';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockeduser } from '../test-helper';
import { UserLevel } from '../../../main/types/user-level';

vi.mock('express-openid-connect', () => ({
  requiresAuth: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
}));

vi.mock('../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    getLoggedInUserPortalId: vi.fn().mockReturnValue('123'),
    getLoggedInUserProfile: vi.fn().mockReturnValue(mockeduser),
  },
}));

const registerRoute = async (app: express.Express) => {
  const { default: adminRoute } = await import('../../../main/routes/admin/admin');
  adminRoute(app);
};

describe('Admin Page Access', () => {
  beforeAll(() => {
    vi.resetAllMocks();
  });

  test('should display admin page for super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/admin');
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

    const response = await request(app).get('/admin');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
