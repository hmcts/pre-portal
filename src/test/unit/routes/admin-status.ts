import { Nunjucks } from '../../../main/modules/nunjucks';
import { beforeAll, describe, test } from '@jest/globals';
import { SystemStatus } from '../../../main/services/system-status/system-status';
import { mockeduser } from '../test-helper';
import { UserLevel } from '../../../main/types/user-level';

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        next();
      };
    }),
  };
});

jest.mock('../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation(() => '123'),
      getLoggedInUserProfile: jest.fn().mockImplementation(() => mockeduser),
    },
  };
});

jest.mock('../../../main/services/system-status/system-status');

describe('Admin Status route', () => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  test('should display status page for super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const adminStatus = require('../../../main/routes/admin/admin-status').default;
    adminStatus(app);

    (SystemStatus.prototype.getStatus as jest.Mock).mockResolvedValue({ status: 'ok' });

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/admin/status');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Status');
    expect(response.text).toContain('Edit Request');
    expect(response.text).toContain('Audit');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const adminStatus = require('../../../main/routes/admin/admin-status').default;
    adminStatus(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/status');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
