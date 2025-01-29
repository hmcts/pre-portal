import { describe, test } from '@jest/globals';
import { validateRequest } from '../../../../main/routes/admin/put-users';
import { PutAppAccessRequest, PutPortalAccessRequest, PutUserRequest } from '../../../../main/services/pre-api/types';
import { Role } from '../../../../main/types/user-profile';
import { mockeduser } from '../../test-helper';
import { mockGetCourts, mockGetRoles, mockGetUser, mockPutUser, mockUsers, reset } from '../../../mock-api';
import { Nunjucks } from '../../../../main/modules/nunjucks';
import { UserLevel } from '../../../../main/types/user-level';
import { set } from 'lodash';
import config from 'config';

set(config, 'pre.enableAdminApp', 'true');

const validRequest = {
  id: '12345678-1234-1234-1234-1234567890ab',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@justice.gov.uk',
  phone: '07123456789',
  organisation: 'HMCTS',
  portal_access: [],
  app_access: [
    {
      id: '12345678-1234-1234-1234-1234567890ab',
      court_id: 'court1',
      user_id: '12345678-1234-1234-1234-1234567890ab',
      role_id: '12345678-1234-1234-1234-1234567890ac',
      default_court: true,
    } as PutAppAccessRequest,
  ],
} as PutUserRequest;

describe('validateRequest', () => {
  const roles = [
    { id: '12345678-1234-1234-1234-1234567890ac', name: 'Super User' },
    { id: 'role1', name: 'Level 1' },
    { id: 'role2', name: 'Level 2' },
    { id: 'role3', name: 'Level 3' },
    { id: 'role4', name: 'Level 4' },
  ] as Role[];

  test('should return empty object for valid request', () => {
    const result = validateRequest(validRequest, roles);
    expect(result).toEqual({});
  });

  test('should return an error if first_name is missing or invalid', () => {
    const invalidRequest1 = { ...validRequest, first_name: '' };
    const errors1 = validateRequest(invalidRequest1, roles);
    expect(errors1).toHaveProperty('first_name', 'Enter first name');

    const invalidRequest2 = { ...validRequest, first_name: 'a'.repeat(101) };
    const errors2 = validateRequest(invalidRequest2, roles);
    expect(errors2).toHaveProperty('first_name', 'Enter first name');
  });

  test('should return an error if last_name is missing or invalid', () => {
    const invalidRequest1 = { ...validRequest, last_name: '' };
    const errors1 = validateRequest(invalidRequest1, roles);
    expect(errors1).toHaveProperty('last_name', 'Enter last name');

    const invalidRequest2 = { ...validRequest, last_name: 'a'.repeat(101) };
    const errors2 = validateRequest(invalidRequest2, roles);
    expect(errors2).toHaveProperty('last_name', 'Enter last name');
  });

  test('should return an error if email has wrong domain', () => {
    const invalidRequest1 = { ...validRequest, email: '' };
    const errors1 = validateRequest(invalidRequest1, roles);
    expect(errors1).toHaveProperty(
      'email',
      'Enter email with one of the following domains: justice.gov.uk, hmcts.net, ejudiciary.net, cps.gov.uk, *.cjsm.net'
    );

    const invalidRequest2 = { ...validRequest, email: 'a'.repeat(101) };
    const errors2 = validateRequest(invalidRequest2, roles);
    expect(errors2).toHaveProperty('email');

    const invalidRequest3 = { ...validRequest, email: 'test@justice.gov.uk' };
    const errors3 = validateRequest(invalidRequest3, roles);
    expect(errors3).not.toHaveProperty('email');

    const invalidRequest4 = { ...validRequest, email: 'test@hmcts.net' };
    const errors4 = validateRequest(invalidRequest4, roles);
    expect(errors4).not.toHaveProperty('email');

    const invalidRequest5 = { ...validRequest, email: 'test@ejudiciary.net' };
    const errors5 = validateRequest(invalidRequest5, roles);
    expect(errors5).not.toHaveProperty('email');

    const invalidRequest6 = { ...validRequest, email: 'test@cps.gov.uk' };
    const errors6 = validateRequest(invalidRequest6, roles);
    expect(errors6).not.toHaveProperty('email');

    const invalidRequest7 = { ...validRequest, email: 'test@something.cjsm.net' };
    const errors7 = validateRequest(invalidRequest7, roles);
    expect(errors7).not.toHaveProperty('email');
  });

  test('should return an error if phone is missing or invalid for portal users', () => {
    const invalidRequest = { ...validRequest, phone: '', portal_access: [{} as PutPortalAccessRequest] };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('phone', 'Enter phone number. It is required for users with portal access');
  });

  test('should return an error if organisation is missing or invalid for portal users', () => {
    const invalidRequest = { ...validRequest, organisation: '', portal_access: [{} as PutPortalAccessRequest] };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('organisation', 'Enter organisation. It is required for users with portal access');
  });

  test('should return an error if app_access has duplicate court_id', () => {
    const invalidRequest = {
      ...validRequest,
      app_access: [
        { ...validRequest.app_access[0], court_id: 'court1' },
        { ...validRequest.app_access[0], court_id: 'court1' },
      ],
    };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('app_access_court_id', 'Court must be unique for each app access');
  });

  test('should return an error if app_access has missing role_id', () => {
    const invalidRequest = { ...validRequest, app_access: [{ ...validRequest.app_access[0], role_id: '' }] };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('app_access_role_id', 'Level must be selected for each app access');
  });

  test('should return an error if app_access has missing default_court', () => {
    const invalidRequest = { ...validRequest, app_access: [{ ...validRequest.app_access[0], default_court: false }] };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('app_access_default_court', 'Must have one default (primary) court');
  });

  test('should return an error if app_access has multiple default courts', () => {
    const invalidRequest = {
      ...validRequest,
      app_access: [
        { ...validRequest.app_access[0], default_court: true },
        { ...validRequest.app_access[0], default_court: true },
      ],
    };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('app_access_default_court', 'Must have one default (primary) court');
  });

  test('should return an error if app_access default court does not have highest role', () => {
    const invalidRequest = {
      ...validRequest,
      app_access: [
        { ...validRequest.app_access[1], role_id: 'role1' },
        { ...validRequest.app_access[0], role_id: 'role2' },
      ],
    };
    const errors = validateRequest(invalidRequest, roles);
    expect(errors).toHaveProperty('app_access_default_court_role', 'Primary court must have the highest role level');
  });
});

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

describe('Admin Add New User Page', () => {
  let app;
  let request;

  beforeAll(() => {
    reset();
    app = require('express')();
    new Nunjucks(false).enableFor(app);
    request = require('supertest');
    const addUserRoute = require('../../../../main/routes/admin/put-users').default;
    addUserRoute(app);
  });

  test('should display add new user page for super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetCourts();
    mockGetRoles();

    const response = await request(app).get('/admin/users/new/edit');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('Add new user');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/users/new/edit');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page Not Found');
  });
});

describe('Admin Update User Page', () => {
  let app;
  let request;

  beforeAll(() => {
    reset();
    app = require('express')();
    new Nunjucks(false).enableFor(app);
    request = require('supertest');
    const addUserRoute = require('../../../../main/routes/admin/put-users').default;
    addUserRoute(app);
  });

  test('should display add new user page for super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetCourts();
    mockGetRoles();
    mockGetUser();
    const user = mockUsers[0];

    const response = await request(app).get(`/admin/users/${user.id}/edit`);

    expect(response.status).toEqual(200);
    expect(response.text).toContain('Update user');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const user = mockUsers[0];

    const response = await request(app).get(`/admin/users/${user.id}/edit`);
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page Not Found');
  });
});

describe('Submit Add/Update user request', () => {
  let app;
  let request;

  beforeAll(() => {
    reset();
    app = require('express')();
    app.use(require('body-parser').json());
    new Nunjucks(false).enableFor(app);
    request = require('supertest');
    const addUserRoute = require('../../../../main/routes/admin/put-users').default;
    addUserRoute(app);
  });

  test('should successfully redirect on valid submission', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetRoles();
    mockGetUser();
    mockPutUser(false);

    const response = await request(app)
      .post('/admin/users/submit')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(validRequest));

    expect(response.status).toEqual(302);
    expect(response.headers.location).toEqual('/admin/users/12345678-1234-1234-1234-1234567890ab');
  });

  test('should successfully redirect on valid submission for new user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetRoles();
    mockPutUser();

    const response = await request(app)
      .post('/admin/users/submit')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ ...validRequest, id: '' }));

    expect(response.status).toEqual(302);
    expect(response.headers.location).toContain('/admin/users/');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app)
      .post('/admin/users/submit')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(validRequest));
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page Not Found');
  });
});
