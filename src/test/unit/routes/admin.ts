import { describe, expect, test, vi, beforeAll } from 'vitest';
import { Nunjucks } from '../../../main/modules/nunjucks';
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

describe('Admin Page Access', () => {
  beforeAll(() => {
    vi.resetAllMocks();
  });

  test('should display admin page for super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const adminRoute = require('../../../main/routes/admin/admin').default;
    adminRoute(app);

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
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const adminRoute = require('../../../main/routes/admin/admin').default;
    adminRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
