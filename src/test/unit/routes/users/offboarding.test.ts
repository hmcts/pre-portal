import { Nunjucks } from '../../../../main/modules/nunjucks';
import { mockGetCourtIdsAndNames, mockGetRoles, mockGetUsersByCourt } from '../../../mock-api';
import { Role } from '../../../../main/services/pre-api/types';
import { mockeduser } from '../../test-helper';
import { UserProfile } from '../../../../main/types/user-profile';

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        next();
      };
    }),
  };
});
jest.mock('../../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation((req: Express.Request) => {
        return '123';
      }),
      getLoggedInUserBrowseId: jest.fn().mockImplementation((req: Express.Request) => {
        return 'super-user-access-id';
      }),
      getLoggedInUserProfile: jest.fn().mockImplementation((req: Express.Request) => {
        return mockeduser as UserProfile;
      }),
      isLoggedInSuperUser: jest.fn().mockImplementation((req: Express.Request) => {
        return true;
      }),
    },
  };
});

describe('offboarding route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const app = require('express')();
    new Nunjucks(false).enableFor(app);

    let mockUser = {
      first_name: 'Joe',
      last_name: 'Bloggs',
      email: 'joe.bloggs@example.com',
      user_id: '12345',
      access: {
        court_id: '1abc2',
        last_access: '2026-01-01T12:00:00Z',
        role_name: 'Admin',
        active: true,
      },
    };

    mockGetUsersByCourt([mockUser]);
    mockGetCourtIdsAndNames(new Map([['1abc2', 'Example Court']]));

    let mockRoles: Role[] = [
      {
        id: 'A1',
        name: 'Admin',
      },
    ];
    mockGetRoles(mockRoles);

    const offboarding = require('../../../../main/routes/users/offboarding').default;
    offboarding(app);
  });

  test('Users not visible until court is selected', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const offboarding = require('../../../../main/routes/users/offboarding').default;
    offboarding(app);

    const response = await request(app).get('/user-admin/offboarding');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('User Management');
    expect(response.text).toContain('Choose court name');
    expect(response.text).toContain('Example Court');
    expect(response.text).toContain('No users found.');
  });

  test('Users visible when court is selected', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const offboarding = require('../../../../main/routes/users/offboarding').default;
    offboarding(app);

    const response = await request(app).get('/user-admin/offboarding?courtId=1abc2');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('User Management');
    expect(response.text).not.toContain('No users found.');

    expect(response.text).toContain('<option value="1abc2">Example Court</option>');
    expect(response.text).toContain('Joe Bloggs');

    const adminOption = response.text.match(/<option[^>]*value="A1"[^>]*>/)?.[0] ?? '';
    expect(adminOption).toBeTruthy();
    expect(adminOption).toContain('disabled');
    expect(adminOption).toContain('selected');
  });
});
