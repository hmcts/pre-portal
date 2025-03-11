import { PreClient } from '../pre-api/pre-client';
import { LiveEvent } from '../../types/live-event';
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';
import { CaptureSession } from '../pre-api/types';

export class LiveEventStatusService {
  private client: PreClient;
  private user: string | undefined;

  constructor(req: Request, client: PreClient) {
    this.client = client;
    const loggedInUser = SessionUser.getLoggedInUserProfile(req);

    this.user = loggedInUser?.app_access?.find(role => role?.role?.name === UserLevel.SUPER_USER)?.id;
  }

  public async getMediaKindLiveEventStatuses(): Promise<
    { id: string; name: string; description: string; status: string }[]
  > {
    if (!this.user) {
      throw new Error('User not authorized to access live events.');
    }

    try {
      const liveEvents: LiveEvent[] = await this.client.getLiveEvents(this.user);
      console.log(liveEvents);
      const captureSession: CaptureSession = await this.client.getCaptureSession(liveEvents[0].id);
      console.log(captureSession);
      if (liveEvents.length === 0) {
        return [];
      }
      console.log(liveEvents);
      return liveEvents.map(event => ({
        id: event.id || 'Unknown ID',
        name: event.name || 'Unknown Name',
        description: event.description || 'Unknown Description',
        status: event.resource_state || 'Unknown Status',
      }));
    } catch (error) {
      throw new Error('Failed to retrieve live event statuses.');
    }
  }
}
