import { AccessStatus } from '../../main/types/access-status';
import { UserProfile } from '../../main/types/user-profile';

export const mockeduser: UserProfile = {
  app_access: [
    {
      active: true,
      court: {
        id: 'e2ca657c-8f4f-4d41-b545-c434bb779f20',
        name: 'Leeds Youth',
        court_type: 'CROWN',
        location_code: '',
        regions: [
          {
            name: 'Yorkshire and The Humber',
          },
        ],
        rooms: [],
      },
      id: '5000e766-b50d-4473-85b2-0bb54785c169',
      last_access: null,
      role: {
        id: 'c920307f-5198-48c1-8954-d5277b415853',
        name: 'Super User',
        description: 'Super User',
        permissions: [],
      },
    },
  ],

  portal_access: [
    {
      deleted_at: null,
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      invited_at: '2024-03-13T11:22:03.655Z',
      last_access: null,
      registered_at: null,
      status: AccessStatus.INVITATION_SENT,
    },
  ],
  terms_accepted: {
    PORTAL: true,
  },
  user: {
    id: '9ffcc9fb-db21-4d77-a983-c39b01141c6a',
    first_name: 'test',
    last_name: 'testy',
    email: 'test@testy.com',
    alternative_email: null,
    phone_number: null,
    organisation: null,
    terms_accepted: {
      portal: true,
    },
  },
};

export function mockUser() {
  jest.mock('express-openid-connect', () => {
    return {
      requiresAuth: jest.fn().mockImplementation(() => {
        return (req: any, res: any, next: any) => {
          next();
        };
      }),
    };
  });
  jest.mock('../../main/services/session-user/session-user', () => {
    return {
      SessionUser: {
        getLoggedInUserPortalId: jest.fn().mockImplementation((req: Express.Request) => {
          return '123';
        }),
        getLoggedInUserProfile: jest.fn().mockImplementation((req: Express.Request) => {
          return mockeduser;
        }),
      },
    };
  });
}
