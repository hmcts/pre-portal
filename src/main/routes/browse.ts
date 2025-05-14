import { PreClient } from '../services/pre-api/pre-client';
import { SearchRecordingsRequest } from '../services/pre-api/types';
import { SessionUser } from '../services/session-user/session-user';
import { UserLevel } from '../types/user-level';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import config from 'config';

export const convertIsoToDate = (isoString?: string): string | undefined => {
  if (!isoString) {
    return;
  }
  return new Date(isoString).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function (app: Application): void {
  app.get('/browse', requiresAuth(), async (req, res) => {
    const client = new PreClient();

    const request: SearchRecordingsRequest = {
      captureSessionId: req.query.captureSessionId as string,
      parentRecordingId: req.query.parentRecordingId as string,
      participantId: req.query.participantId as string,
      witnessName: req.query.witnessName as string,
      defendantName: req.query.defendantName as string,
      caseReference: req.query.caseReference as string,
      scheduledFor: req.query.scheduledFor as string,
      courtId: req.query.courtId as string,
      includeDeleted: req.query.includeDeleted as unknown as boolean,
      page: req.query.page as unknown as number,
      size: 10,
    };

    const { recordings, pagination } = await client.getRecordings(
      await SessionUser.getLoggedInUserPortalId(req),
      request
    );

    // Example 9 pages: <Previous 0 ... 2 3 |4| 5 6 ... 8 Next>
    // Page starts at 0
    // Rolling window of 5 pages centered on the current page
    // The current page is 5 then 2 pages before and 2 pages after does not include the first+1 or last-1 pages so add in ellipsis

    const isSuperUser =
      SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)
        .length > 0;

    const updatedRecordings = recordings.map(recording => ({
      ...recording,
      capture_session: {
        ...recording.capture_session,
        case_closed_at: convertIsoToDate(recording.capture_session.case_closed_at),
      },
    }));

    const { paginationLinks, title } = client.createPagination(pagination, 'browse', 'Recordings', recordings.length);

    res.render('browse', {
      recordings: updatedRecordings,
      paginationLinks,
      title,
      user: SessionUser.getLoggedInUserProfile(req).user,
      enableCaseStateColumn: config.get('pre.enableCaseStateColumn') === 'true',
      isSuperUser: isSuperUser,
      removeWitnessLastName: config.get('pre.removeWitnessLastName') === 'true',
    });
  });
}
