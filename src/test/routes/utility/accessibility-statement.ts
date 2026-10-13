import { app } from '../../../main/app';

import request from 'supertest';
import { mockeduser } from '../../unit/test-helper';
import { UserProfile } from '../../../main/types/user-profile';

jest.mock('../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation((req: Express.Request) => {
        return '123';
      }),
      getLoggedInUserProfile: jest.fn().mockImplementation((req: Express.Request) => {
        return mockeduser as UserProfile;
      }),
    },
  };
});

/* eslint-disable jest/expect-expect */
describe('Accessibility Statement page', () => {
  describe('on GET', () => {
    test('should return 200', async () => {
      await request(app)
        .get('/accessibility-statement')
        .expect(res => {
          expect(res.status).toBe(200);
          expect(res.text).toContain('Accessibility statement');
        });
    });
  });
});
