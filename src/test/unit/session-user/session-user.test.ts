/* eslint-disable jest/expect-expect */
import { SessionUser } from '../../../main/services/session-user/session-user';
import { createRequest } from 'node-mocks-http';
import { UserProfile } from '../../../main/types/user-profile';
import { mockeduser } from '../test-helper';

jest.mock('../../../main/services/pre-api/pre-client', () => ({
  PreClient: jest.fn().mockImplementation(() => ({
    constructor: () => {},
    getActiveUserByEmail: jest.fn().mockImplementation((email: string) => {
      if (email === 'inactive@user.com') {
        return Promise.reject(new Error('User is not active: ' + email));
      }
      return Promise.resolve(mockeduser as UserProfile);
    }),
  })),
}));
describe('Session Users', () => {
  test('getLoggedInUser no session', async () => {
    const t = async () => {
      await SessionUser.getLoggedInUserPortalId({} as Express.Request);
    };
    await expect(t).rejects.toThrow('No session found');
  });

  test('getLoggedInUser no userProfile', async () => {
    const req = createRequest();
    req['__session'] = {};
    const t = async () => {
      await SessionUser.getLoggedInUserPortalId(req);
    };
    await expect(t).rejects.toThrow('No userProfile found in session');
  });

  test('getLoggedInUserPortalId no user id', async () => {
    const req = createRequest();
    req['__session'] = {
      userProfile: {},
    };
    const t = async () => {
      await SessionUser.getLoggedInUserPortalId(req);
    };
    await expect(t).rejects.toThrow('No user id found in session');
  });

  test('getLoggedInUser ok', async () => {
    const req = createRequest();
    req['__session'] = {
      userProfile: mockeduser as UserProfile,
    };
    const user = await SessionUser.getLoggedInUserPortalId(req);
    expect(user).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  });

  test('getLoggedInUserBrowseId uses active super user app access when available', async () => {
    const req = createRequest();
    req['__session'] = {
      userProfile: mockeduser as UserProfile,
    };
    const user = await SessionUser.getLoggedInUserBrowseId(req);
    expect(user).toBe('5000e766-b50d-4473-85b2-0bb54785c169');
  });

  test('getLoggedInUserBrowseId falls back to portal access when super user app access is inactive', async () => {
    const req = createRequest();
    const userProfile = {
      ...mockeduser,
      app_access: mockeduser.app_access.map(access => ({ ...access, active: false })),
    } as UserProfile;
    req['__session'] = {
      userProfile,
    };
    const user = await SessionUser.getLoggedInUserBrowseId(req);
    expect(user).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  });

  test('getLoggedInUserProfile no session', () => {
    const t = () => {
      SessionUser.getLoggedInUserProfile({} as Express.Request);
    };
    expect(t).toThrow('No session found');
  });

  test('getLoggedInUserProfile no user profile', () => {
    const req = createRequest();
    req['__session'] = {};
    const t = () => {
      SessionUser.getLoggedInUserProfile(req);
    };
    expect(t).toThrow('No userProfile found in session');
  });

  test('getLoggedInUserProfile ok', () => {
    const req = createRequest();
    req['__session'] = {
      userProfile: mockeduser as UserProfile,
    };
    const user = SessionUser.getLoggedInUserProfile(req);
    expect(user).toBe(mockeduser);
  });

  test('getLoggedInUserProfile inactive', async () => {
    const req = createRequest();
    const email = 'inactive@user.com';
    const userProfile = { ...mockeduser };
    userProfile.user.email = email;
    req['__session'] = {
      userProfile,
    };
    const t = async () => {
      await SessionUser.getLoggedInUserPortalId(req);
    };
    // ensure we don't swallow pre api errors here
    await expect(t).rejects.toThrow('User is not active: ' + email);
  });
});
