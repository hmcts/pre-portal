import { PreClient } from '../services/pre-api/pre-client';
import { SearchRecordingsRequest } from '../services/pre-api/types';
import { SessionUser } from '../services/session-user/session-user';
import { UserLevel } from '../types/user-level';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';

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
    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const primaryEmail = (userProfileForCjsm.user.email || '').toLowerCase();
    const alternativeEmail = (userProfileForCjsm.user.alternative_email || '').toLowerCase();
    const hasCjsmInPrimary = primaryEmail.endsWith('cjsm.net');
    const hasCjsmInAlt = alternativeEmail.endsWith('cjsm.net');
    const showCjsmBanner = !hasCjsmInPrimary && hasCjsmInAlt;

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

    const paginationLinks = {
      previous: {},
      next: {},
      items: [] as ({ href: string; number: number; current: boolean } | { ellipsis: boolean })[],
    };

    // Add previous link if not on the first page
    if (pagination.currentPage > 0) {
      paginationLinks.previous = {
        href: `/browse?page=${pagination.currentPage - 1}`,
      };
    }

    // Add next link if not on the last page
    if (pagination.currentPage < pagination.totalPages - 1) {
      paginationLinks.next = {
        href: `/browse?page=${pagination.currentPage + 1}`,
      };
    }

    // Always add the first page
    paginationLinks.items.push({
      href: '/browse?page=0',
      number: 1,
      current: 0 === pagination.currentPage,
    });

    // Add an ellipsis after the first page if the 2nd page is not in the window
    if (pagination.currentPage > 3) {
      paginationLinks.items.push({ ellipsis: true });
    }

    // Add the pages immediately 2 before and 2 after the current page to create a rolling window of 5 pages
    for (
      let i = Math.max(1, pagination.currentPage - 2);
      i <= Math.min(pagination.currentPage + 2, pagination.totalPages - 2);
      i++
    ) {
      paginationLinks.items.push({
        href: `/browse?page=${i}`,
        number: i + 1,
        current: i === pagination.currentPage,
      });
    }

    // Add an ellipsis before the last page if the 2nd last page is not in the window
    if (pagination.currentPage < pagination.totalPages - 4) {
      paginationLinks.items.push({ ellipsis: true });
    }

    // Add the last page if there is more than one page (don't repeat the first page)
    if (pagination.totalPages > 1) {
      paginationLinks.items.push({
        href: `/browse?page=${pagination.totalPages - 1}`,
        number: pagination.totalPages,
        current: pagination.totalPages - 1 === pagination.currentPage,
      });
    }

    let title = 'Recordings';
    if (updatedRecordings.length > 0) {
      title = `Recordings ${pagination.currentPage * pagination.size + 1} to ${Math.min(
        (pagination.currentPage + 1) * pagination.size,
        pagination.totalElements
      )} of ${pagination.totalElements}`;
    }

    res.render('browse', {
      recordings: updatedRecordings,
      paginationLinks,
      title,
      user: SessionUser.getLoggedInUserProfile(req).user,
      isSuperUser: isSuperUser,
      pageUrl: req.url,
      showCjsmBanner,
    });
  });
}
