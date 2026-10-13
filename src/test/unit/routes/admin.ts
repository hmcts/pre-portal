import { Nunjucks } from '../../../main/modules/nunjucks';
import { beforeAll, describe, test, jest } from '@jest/globals';
import { mockeduser, mockUser } from '../test-helper';
import { UserLevel } from '../../../main/types/user-level';

mockUser();

describe('Admin Page Access', () => {
  beforeAll(() => {
    jest.resetAllMocks();
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
    expect(response.status).toEqual(302);
    expect(response.text).toContain('Found. Redirecting to system/status');
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
