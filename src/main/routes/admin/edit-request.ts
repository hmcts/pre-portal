import { PutEditInstruction, PutEditRequest } from '../../services/pre-api/types';
import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';
import { validateId, getCurrentEditRequest, isFlagEnabled, isStatusEditable } from '../../utils/helpers';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { Logger } from '@hmcts/nodejs-logging';
import { v4 as uuid } from 'uuid';
import config from 'config';

const parseIsoDuration = (duration: string): number => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
  const matches = duration.match(regex);

  if (!matches) {
    throw new Error('Invalid ISO 8601 duration format');
  }

  const hours = parseInt(matches[1] ?? 0, 10);
  const minutes = parseInt(matches[2] ?? 0, 10);
  const seconds = parseInt(matches[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
};

const validateInstruction = (instruction: PutEditInstruction, duration: string): Object => {
  const errors = {};

  const [h1, m1, s1] = instruction.start_of_cut.split(':').map(Number);
  const [h2, m2, s2] = instruction.end_of_cut.split(':').map(Number);
  const startTotalSeconds = h1 * 3600 + m1 * 60 + s1;
  const endTotalSeconds = h2 * 3600 + m2 * 60 + s2;

  const durationInSeconds = parseIsoDuration(duration);

  if (instruction.start_of_cut === '') {
    errors['startTime'] = 'Please enter a valid time reference';
  } else if (!instruction.start_of_cut.match('^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$')) {
    errors['startTime'] = 'The Start reference entered is not in the HH:MM:SS format';
  }

  if (instruction.end_of_cut === '') {
    errors['endTime'] = 'Please enter a valid time reference';
  } else if (!instruction.end_of_cut.match('^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$')) {
    errors['endTime'] = 'The End reference entered is not in the HH:MM:SS format';
  } else if (startTotalSeconds >= endTotalSeconds) {
    errors['endTime'] = 'End reference cannot be equal or less than the Start reference';
  } else if (endTotalSeconds > durationInSeconds) {
    errors['endTime'] = 'References cannot be greater than the duration of the recording';
  }
  return errors;
};

export const validateRequest = (editRequest: PutEditRequest, duration: string): Object | undefined => {
  for (let instruction of editRequest.edit_instructions) {
    const errors = validateInstruction(instruction, duration);
    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
};

export default (app: Application): void => {
  if (!isFlagEnabled('pre.enableAutomatedEditing')) {
    return;
  }

  const logger = Logger.getLogger('edit-request');

  app.get('/edit-request/:id', requiresAuth(), async (req, res, next) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
      const userProfile = SessionUser.getLoggedInUserProfile(req);

      const client = new PreClient();
      const recording = await client.getRecording(userPortalId, req.params.id);

      if (recording === null) {
        res.status(404);
        res.render('not-found');
        return;
      }

      const editRequest = await getCurrentEditRequest(client, userPortalId, recording.id);
      if (editRequest === null) {
        res.status(404);
        res.render('not-found');
        return;
      }

      if (!isStatusEditable(editRequest.status)) {
        res.redirect(`/edit-request/${req.params.id}/view`);
        return;
      }

      logger.info(`Recording ${recording.id} accessed by User ${userProfile.user.email}`);

      await client.putAudit(userPortalId, {
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
      const editRequestPostUrl = `/edit-request/${req.params.id}`;
      const mediaKindPlayerKey = config.get('pre.mediaKindPlayerKey');
      res.render('edit-request', {
        recording,
        recordingPlaybackDataUrl,
        editRequestPostUrl,
        mediaKindPlayerKey,
        editRequest,
      });
    } catch (e) {
      next(e);
    }
  });

  app.post('/edit-request/:id', requiresAuth(), async (req, res, next) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const client = new PreClient();
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);

      const recording = await client.getRecording(userPortalId, req.params.id);

      if (!recording) {
        res.status(404);
        res.render('not-found');
        return;
      }
      let request = req.body as PutEditRequest;

      const errors = validateRequest(request, recording.duration);

      if (errors) {
        res.status(400);
        res.json({ errors });
        return;
      }

      if (req.body.status in ['REJECTED', 'COMPLETE']) {
        request = {
          ...request,
          id: uuid(),
          status: 'DRAFT',
          jointly_agreed: undefined,
          approved_at: undefined,
          approved_by: undefined,
          rejection_reason: undefined,
        };
      }

      await client.putEditRequest(userPortalId, request);
      res.json(await getCurrentEditRequest(client, userPortalId, req.params.id));
    } catch (e) {
      console.log(e);
      next(e);
    }
  });
};
