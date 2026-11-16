import { PreClient } from '../services/pre-api/pre-client';
import { SessionUser } from '../services/session-user/session-user';

import { Application } from 'express';
import openidConnect from 'express-openid-connect';
import config from 'config';
import { v4 as uuid } from 'uuid';

import { Logger } from '@hmcts/nodejs-logging';
import { getSingleId } from '../utils/helpers';

const logger = Logger.getLogger('watch');

function validateId(input: string | string[]): boolean {
  const id = getSingleId(input);
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export default function (app: Application): void {
  app.get('/watch/:id', openidConnect.requiresAuth(), async (req, res, next) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
      const userProfile = SessionUser.getLoggedInUserProfile(req);

      const client = new PreClient();
      const recording = await client.getRecording(
        await SessionUser.getLoggedInUserPortalId(req),
        getSingleId(req.params.id)
      );

      if (recording === null) {
        res.status(404);
        res.render('not-found');
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
      const mediaKindPlayerKey = config.get('pre.mediaKindPlayerKey');
      res.render('watch', {
        recording,
        recordingPlaybackDataUrl,
        mediaKindPlayerKey,
      });
    } catch (e) {
      next(e);
    }
  });

  app.get('/watch/:id/playback', openidConnect.requiresAuth(), async (req, res) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.json({ message: 'Not found' });
      return;
    }

    try {
      const client = new PreClient();
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);

      const recordingPlaybackData = await client.getRecordingPlaybackDataMk(userPortalId, getSingleId(req.params.id));

      if (recordingPlaybackData === null) {
        res.status(404);
        res.json({ message: 'Not found' });
        return;
      }

      res.json(recordingPlaybackData);
    } catch (e) {
      const newMessage = e instanceof Error ? e.message : 'Internal server error';
      res.status(500);
      res.json({ message: newMessage });
    }
  });
}
