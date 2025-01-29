import { Nunjucks } from '../../../../main/modules/nunjucks';
import { beforeAll, describe, test, jest } from '@jest/globals';
import { mockeduser } from '../../test-helper';
import { UserLevel } from '../../../../main/types/user-level';
import { mockGetCourts, mockGetRoles, mockGetUsers, reset } from '../../../mock-api';
import config from 'config';
import { set } from 'lodash';

set(config, 'pre.enableAdminApp', 'true');

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        next();
      };
    }),
  };
});

jest.mock('../../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation(() => '123'),
      getLoggedInUserProfile: jest.fn().mockImplementation(() => mockeduser),
    },
  };
});

describe('Admin Search Users Page Access', () => {
  let app;
  let request;

  beforeAll(() => {
    reset();
    app = require('express')();
    new Nunjucks(false).enableFor(app);
    request = require('supertest');
    const searchUsersRoute = require('../../../../main/routes/admin/users').default;
    searchUsersRoute(app);
  });

  test('should display search users page for super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetCourts();
    mockGetRoles();
    mockGetUsers();

    const response = await request(app).get('/admin/users');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('Pre-Recorded Evidence: Users');
    expect(response.text).not.toContain('No records found.');
  });

  test('should display search users page for super user when no users in the system', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetCourts();
    mockGetRoles();
    mockGetUsers([]);

    const response = await request(app).get('/admin/users');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('Pre-Recorded Evidence: Users');
    expect(response.text).toContain('No records found.');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/users');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page Not Found');
  });
});
