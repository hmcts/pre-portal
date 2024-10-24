import { UserProfile } from '../../types/user-profile';
import { PreClient } from '../pre-api/pre-client';

export class SessionUser {
  public static async getLoggedInUserPortalId(req: Express.Request): Promise<string> {
    if (!req['__session']) {
      throw new Error('No session found');
    }
    if (!req['__session'].userProfile) {
      throw new Error('No userProfile found in session');
    }
    const user = req['__session'].userProfile as UserProfile;
    if (!user.portal_access || !user.portal_access[0]) {
      throw new Error('No user id found in session');
    }
    // check the users profile in the API
    const client = new PreClient();
    await client.getActiveUserByEmail(user.user.email);

    return user.portal_access[0].id;
  }

  public static getLoggedInUserProfile(req: Express.Request): UserProfile {
    if (!req['__session']) {
      throw new Error('No session found');
    }
    if (!req['__session'].userProfile) {
      throw new Error('No userProfile found in session');
    }
    return req['__session'].userProfile as UserProfile;
  }
}
