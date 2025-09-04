import { PreClient } from '../pre-api/pre-client';
import { Court } from '../../types/court';
import { Request } from 'express';
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';

export class CourtService {
  private readonly client: PreClient;
  private readonly user: string | undefined;

  constructor(req: Request, client: PreClient) {
    this.client = client;

    const loggedInUser = SessionUser.getLoggedInUserProfile(req);
    this.user = loggedInUser?.app_access?.find(role => role?.role?.name === UserLevel.SUPER_USER)?.id;
  }

  public async getCourtOptions(): Promise<{ id: string; name: string }[]> {
    if (!this.user) {
      throw new Error('User not authorized to access court data.');
    }

    let allCourts: Court[] = [];
    let page = 0;
    let hasNext = true;

    while (hasNext) {
      const courtsResponse = await this.client.getCourts(this.user, page, 100);
      const courtList: Court[] = courtsResponse._embedded?.courtDTOList || [];
      allCourts = [...allCourts, ...courtList];

      hasNext = !!courtsResponse._links?.next;
      page++;
    }

    allCourts.sort((a, b) => a.name.localeCompare(b.name));

    return allCourts.map(court => ({
      id: court.id,
      name: court.name,
    }));
  }
}
