// import { PreClient } from '../pre-api/pre-client';
// import { LiveEvent } from '../../types/live-event';
// import { SessionUser } from '../session-user/session-user';
// import { UserLevel } from '../../types/user-level';
// import { Request } from 'express';
//
// export class LiveEventStatusService {
//     private client: PreClient;
//     private user: string | undefined;
//
//
//     constructor(req: Request, client: PreClient) {
//         this.client = client;
//         const loggedInUser = SessionUser.getLoggedInUserProfile(req);
//         this.user = loggedInUser.app_access.find(role => role.role.name === UserLevel.SUPER_USER)?.id
//     }
//
//     public async getMediaKindLiveEventStatuses() {
//         try {
//           if (!this.user) {
//                         throw new Error('User not authorized to access live events.');
//                     }
//             const liveEvents: LiveEvent[] = await this.client.getLiveEvents(this.user);
//         if (liveEvents.length > 0) {
//             return liveEvents.map(event => ({
//                 id: event.id || "Unknown ID",
//                 name: event.name || 'Unknown Name',
//                 description: event.description || 'Unknown Description',
//                 status: event.resource_state || 'Unknown Status'
//
//             }))
//           else {
//           console.log('no live events');
//         }} catch (error) {
//             console.error('Error fetching live events:', error);
//             throw new Error('Failed to retrieve live event statuses.');
//         }}
//     }
// }

import { PreClient } from '../pre-api/pre-client';
import { LiveEvent } from '../../types/live-event';
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';

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

      if (liveEvents.length === 0) {
        //console.log('No live events found.');
        return []; // Return an empty array instead of continuing to map
      }

      return liveEvents.map(event => ({
        id: event.id || 'Unknown ID',
        name: event.name || 'Unknown Name',
        description: event.description || 'Unknown Description',
        status: event.resource_state || 'Unknown Status',
      }));
    } catch (error) {
      //console.error('Error fetching live events:', error);
      throw new Error('Failed to retrieve live event statuses.');
    }
  }
}
