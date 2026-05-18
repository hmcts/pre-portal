import { PreClient } from '../services/pre-api/pre-client';
import { Recording, SearchRecordingsRequest } from '../services/pre-api/types';
import { SessionUser } from '../services/session-user/session-user';
import { UserLevel } from '../types/user-level';

import { Logger } from '@hmcts/nodejs-logging';
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

export const getEditRequestId = (editInstructions?: string): string | undefined => {
  if (!editInstructions) return;
  try {
    const parsed = JSON.parse(editInstructions);
    return parsed.editRequestId || parsed.edit_request_id || parsed.editRequest?.id;
  } catch {
    return;
  }
};

type BrowseRecording = Recording & {
  row_id?: string;
};

const buildBrowseRows = (recordings: Recording[]): BrowseRecording[] => {
  // Find which edit requests should NOT show as pending rows because they've already been applied.
  const nonPendingEditRequestIds = new Set<string>();
  for (const recording of recordings) {
    if (recording.version > 1) {
      const editRequestId = getEditRequestId(recording.edit_instructions);
      if (editRequestId) nonPendingEditRequestIds.add(editRequestId);
    }
  }

  // Look up an edit request's current status by searching all recordings.
  const findEditRequestStatus = (editRequestId: string): string | undefined => {
    for (const recording of recordings) {
      for (const editRequest of recording.edit_requests || []) {
        if (editRequest.id === editRequestId) return editRequest.status;
      }
    }
  };

  // Create a display row, apply formatting and property overrides.
  const createBrowseRow = (recording: Recording, overrides?: Partial<BrowseRecording>): BrowseRecording => ({
    ...recording,
    ...overrides,
    capture_session: {
      ...recording.capture_session,
      case_closed_at: convertIsoToDate(recording.capture_session.case_closed_at),
    },
  });

  // Group recordings by their root ID (V1 uses its own ID. Pending and V2+ uses parent_recording_id).
  const recordingsByRootId = new Map<string, Recording[]>();
  for (const recording of recordings) {
    const rootId = recording.parent_recording_id || recording.id;
    if (!recordingsByRootId.has(rootId)) recordingsByRootId.set(rootId, []);
    recordingsByRootId.get(rootId)!.push(recording);
  }

  const result: BrowseRecording[] = [];

  // Process each group of related recordings.
  for (const recordingsInGroup of recordingsByRootId.values()) {
    const completedEditRequestRows: BrowseRecording[] = []; // V2, V3, ... (Completed edits)
    const pendingEditRequestRows: BrowseRecording[] = []; // Edits in progress (submitted, approved, etc)
    const draftEditRequestRows: BrowseRecording[] = []; // Edits with status 'DRAFT'
    let originalRecording: BrowseRecording | undefined;

    // Add rows for each real recording in the group.
    for (const recording of recordingsInGroup) {
      let statusToDisplay: string | undefined;
      if (recording.version === 1) {
        statusToDisplay = undefined; // Original recordings don't show an edit status.
      } else {
        const editRequestId = getEditRequestId(recording.edit_instructions);
        statusToDisplay = (editRequestId ? findEditRequestStatus(editRequestId) : undefined) ?? recording.edit_status;
      }

      const recordingRow = createBrowseRow(recording, { edit_status: statusToDisplay });

      if (recording.version === 1) {
        originalRecording = recordingRow;
      } else {
        completedEditRequestRows.push(recordingRow);
      }

      // Create rows for edit requests that aren't complete.
      for (const editRequest of recording.edit_requests || []) {
        if (editRequest.status === 'COMPLETE') continue;
        if (nonPendingEditRequestIds.has(editRequest.id)) continue;

        const editRequestRow = createBrowseRow(recording, {
          version: (recording.total_version_count ?? recording.version) + 1,
          edit_status: editRequest.status,
          row_id: `${recording.id}-${editRequest.id}`,
        });

        if (editRequest.status === 'DRAFT') {
          draftEditRequestRows.push(editRequestRow);
        } else {
          pendingEditRequestRows.push(editRequestRow);
        }
      }
    }

    // Sort completed edit request rows by version number (newest first).
    completedEditRequestRows.sort((a, b) => b.version - a.version);

    // Add rows in order: completed edits → pending edits → drafts → original.
    result.push(...completedEditRequestRows, ...pendingEditRequestRows, ...draftEditRequestRows);
    if (originalRecording) result.push(originalRecording);
  }

  return result;
};

export default function (app: Application): void {
  app.get('/browse', requiresAuth(), async (req, res) => {
    const logger = Logger.getLogger('browse-route');
    const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const primaryEmail = (userProfileForCjsm.user.email || '').toLowerCase();
    const alternativeEmail = (userProfileForCjsm.user.alternative_email || '').toLowerCase();

    logger.info('Full userProfile.user:', JSON.stringify(userProfileForCjsm.user, null, 2));
    logger.info('alternative_email value:', userProfileForCjsm.user.alternative_email);
    logger.info('alternative_email type:', typeof userProfileForCjsm.user.alternative_email);

    const hasCjsmInPrimary = primaryEmail.endsWith('cjsm.net');
    const hasCjsmInAlt = alternativeEmail.endsWith('cjsm.net');
    const showCjsmBanner = !hasCjsmInPrimary && hasCjsmInAlt;

    logger.info('hasCjsmInPrimary:', hasCjsmInPrimary);
    logger.info('hasCjsmInAlt:', hasCjsmInAlt);
    logger.info('showCjsmBanner:', showCjsmBanner);
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

    const { recordings, pagination } = await client.getRecordings(userPortalId, request);

    // Example 9 pages: <Previous 0 ... 2 3 |4| 5 6 ... 8 Next>
    // Page starts at 0
    // Rolling window of 5 pages centered on the current page
    // The current page is 5 then 2 pages before and 2 pages after does not include the first+1 or last-1 pages so add in ellipsis

    const isSuperUser =
      SessionUser.getLoggedInUserProfile(req).app_access.filter(role => role.role.name === UserLevel.SUPER_USER)
        .length > 0;

    const recordingsForView = buildBrowseRows(recordings);

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
    if (recordings.length > 0) {
      title = `Recordings ${pagination.currentPage * pagination.size + 1} to ${Math.min(
        (pagination.currentPage + 1) * pagination.size,
        pagination.totalElements
      )} of ${pagination.totalElements}`;
    }

    res.render('browse', {
      recordings: recordingsForView,
      paginationLinks,
      title,
      user: SessionUser.getLoggedInUserProfile(req).user,
      enableAutomatedEditing: config.get('pre.enableAutomatedEditing') === 'true',
      isSuperUser: isSuperUser,
      pageUrl: req.url,
      showCjsmBanner,
    });
  });
}
