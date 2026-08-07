import { PreClient } from '../services/pre-api/pre-client';
import { SessionUser } from '../services/session-user/session-user';
import { isFlagEnabled, secondsToTimeString, timeStringToSeconds, validateId } from '../utils/helpers';

import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { v4 as uuid } from 'uuid';
import { AppliedEditInstruction, PutEditInstruction, RecordingAppliedEdits } from '../services/pre-api/types';

export const parseAppliedEdits = async (
  edits: string,
  client: PreClient,
  xUserId: string
): Promise<
  | {
      appliedEdits: AppliedEditInstruction[];
      approvedBy: string;
      approvedAt: string;
    }
  | undefined
> => {
  if (!edits || edits == '') {
    return;
  }
  const editInstructions = JSON.parse(edits) as RecordingAppliedEdits;
  if (!editInstructions.editInstructions || !editInstructions.editRequestId) {
    return;
  }

  const appliedEdits = editInstructions.editInstructions.requestedInstructions.map(
    (instruction: PutEditInstruction) =>
      ({
        startOfCut: instruction.start_of_cut,
        start: timeStringToSeconds(instruction.start_of_cut),
        endOfCut: instruction.end_of_cut,
        end: timeStringToSeconds(instruction.end_of_cut),
        reason: instruction.reason,
      }) as unknown as AppliedEditInstruction
  );

  for (const edit of appliedEdits) {
    edit.runtimeReference = secondsToTimeString(edit.end - edit.start);
  }

  const editRequest = await client.getEditRequest(xUserId, editInstructions.editRequestId);
  return {
    appliedEdits,
    approvedBy: editRequest?.approved_by || '',
    approvedAt: editRequest?.approved_at ? new Date(editRequest.approved_at).toLocaleDateString() : '',
  };
};

export default function (app: Application): void {
  const logger = Logger.getLogger('watch');

  app.get('/watch/:id', requiresAuth(), async (req, res, next) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const userBrowseId = await SessionUser.getLoggedInUserBrowseId(req);
      const userProfile = SessionUser.getLoggedInUserProfile(req);

      const client = new PreClient();
      const recording = await client.getRecording(userBrowseId, req.params.id);

      if (recording === null) {
        res.status(404);
        res.render('not-found');
        return;
      }
      logger.info(`Recording ${recording.id} accessed by User ${userProfile.user.email}`);

      await client.putAudit(userBrowseId, {
        id: uuid(),
        functional_area: 'Video Player',
        category: 'Recording',
        activity: 'Play',
        source: 'PORTAL',
        audit_details: {
          recordingId: recording.id,
          caseReference: recording.case_reference,
          caseId: recording.case_id,
          courtName: recording.capture_session.court_name,
          description: 'Recording accessed by User ' + userProfile.user.email,
          email: userProfile.user.email,
        },
      });

      const recordingPlaybackDataUrl = `/watch/${req.params.id}/playback`;
      const mediaKindPlayerKey = config.get('pre.mediaKindPlayerKey');
      const enableAutomatedEditing = isFlagEnabled('pre.enableAutomatedEditing');

      const editRequestRecordingId =
        recording.version === 1 ? recording.id : recording.parent_recording_id || recording.id;

      let editRequestStatus: string | undefined;
      if (recording.version === 1) {
        editRequestStatus = recording.edit_requests?.find(editRequest => editRequest.status !== 'COMPLETE')?.status;
      } else {
        const parentRecording = await client.getRecording(userBrowseId, editRequestRecordingId);
        editRequestStatus = parentRecording?.edit_requests?.find(
          editRequest => editRequest.status !== 'COMPLETE'
        )?.status;
      }

      let parsedAppliedEdits = await parseAppliedEdits(recording.edit_instructions, client, userBrowseId);
      res.render('watch', {
        recording,
        recordingPlaybackDataUrl,
        mediaKindPlayerKey,
        appliedEdits: enableAutomatedEditing ? parsedAppliedEdits : undefined,
        enableAutomatedEditing,
        editRequestStatus,
        editRequestRecordingId,
      });
    } catch (e) {
      next(e);
    }
  });

  app.get('/watch/:id/playback', requiresAuth(), async (req, res) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.json({ message: 'Not found' });
      return;
    }

    try {
      const client = new PreClient();
      const userBrowseId = await SessionUser.getLoggedInUserBrowseId(req);

      const recordingPlaybackData = await client.getRecordingPlaybackDataMk(userBrowseId, req.params.id);

      if (recordingPlaybackData === null) {
        res.status(404);
        res.json({ message: 'Not found' });
        return;
      }

      res.json(recordingPlaybackData);
    } catch (e) {
      res.status(500);
      res.json({ message: e.message });
    }
  });
}
