import { PreClient } from '../pre-api/pre-client';
import { CaptureSession } from '../pre-api/types'; // Ensure this import is correct
import { SessionUser } from '../session-user/session-user';
import { UserLevel } from '../../types/user-level';
import { Request } from 'express';
import { Logger } from '@hmcts/nodejs-logging';

export class CaptureSessionService {
  logger = Logger.getLogger('capture-session-service');
  private readonly client: PreClient;
  private readonly user: string | undefined;

  constructor(req: Request, client: PreClient) {
    this.client = client;
    const loggedInUser = SessionUser.getLoggedInUserProfile(req);

    this.user = loggedInUser?.app_access?.find(role => role?.role?.name === UserLevel.SUPER_USER)?.id;
  }

  public async getCaptureSessionsForToday(): Promise<
    {
      captureSessionId: string;
      captureSessionStatus: string;
      court: string;
      bookingId: string;
      liveEventId: string;
      caseReference: string;
    }[]
  > {
    if (!this.user) {
      throw new Error('User not authorized to access live events.');
    }
    try {
      const captureSessions: CaptureSession[] = await this.client.getCaptureSessionsToday(this.user);

      if (captureSessions.length === 0) {
        this.logger.info('No capture sessions found for today.');
        return [];
      }

      return await Promise.all(
        captureSessions.map(async capSess => {
          const liveEventId = capSess.live_output_url.split('/').pop();

          const startTime = capSess.started_at.split('T')[1];
          const hourAndMinuteTime = startTime.split(':');
          const formattedStartTime = `${hourAndMinuteTime[0]}:${hourAndMinuteTime[1]}`;

          return {
            captureSessionId: capSess.id,
            captureSessionStatus: capSess.status,
            startTime: formattedStartTime,
            court: capSess.court_name,
            bookingId: capSess.booking_id,
            liveEventId: liveEventId || 'Unknown ID',
            caseReference: capSess.case_reference || 'Unknown',
          };
        })
      );
    } catch (error) {
      throw new Error(`Failed to retrieve capture sessions for today: ${error}`);
    }
  }
}
