import { PreClient } from '../pre-api/pre-client';
import { LiveEvent } from '../../types/live-event';
import { CaptureSession } from '../pre-api/types'; // Ensure this import is correct
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';

export class LiveEventStatusService {
  private readonly client: PreClient;
  private readonly user: string | undefined;

  constructor(req: Request, client: PreClient) {
    this.client = client;
    const loggedInUser = SessionUser.getLoggedInUserProfile(req);

    this.user = loggedInUser?.app_access?.find(role => role?.role?.name === UserLevel.SUPER_USER)?.id;
  }

  public async getMediaKindLiveEventStatuses(): Promise<
    { id: string; name: string; description: string; status: string; caseReference: string }[]
  > {
    if (!this.user) {
      throw new Error('User not authorized to access live events.');
    }
    try {
      const liveEvents: LiveEvent[] = await this.client.getLiveEvents(this.user);

      if (liveEvents.length === 0) {
        return [];
      }

      const eventsWithCaseReferences = await Promise.all(
        liveEvents.map(async event => {
          const liveEventId = event.id.split('/').pop();

          let caseReference = 'Unknown Case Reference';

          if (liveEventId && this.user) {
            try {
              const captureSession: CaptureSession = await this.client.getCaptureSession(liveEventId, this.user);
              caseReference = captureSession?.case_reference || 'Unknown Case Reference';
            } catch (error) {
              console.error(`Failed to fetch capture session for event ID: ${liveEventId}`, error);
            }
          }

          return {
            id: liveEventId || 'Unknown ID',
            name: event.name || 'Unknown Name',
            description: event.description || 'Unknown Description',
            status: event.resource_state || 'Unknown Status',
            caseReference,
          };
        })
      );

      return eventsWithCaseReferences;
    } catch (error) {
      throw new Error('Failed to retrieve live event statuses.');
    }
  }
}
