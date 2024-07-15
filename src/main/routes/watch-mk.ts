import { PreClient } from '../services/pre-api/pre-client';
import { SessionUser } from '../services/session-user/session-user';

import config from 'config';
import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { v4 as uuid } from 'uuid';

function validateId(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export default function (app: Application): void {
  if (config.get('pre.enableMkWatchPage')?.toString().toLowerCase() !== 'true') {
    return;
  }

  app.get('/watch-mk/:id', requiresAuth(), async (req, res) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
      const userProfile = SessionUser.getLoggedInUserProfile(req);

      const client = new PreClient();
      const recording = await client.getRecording(await SessionUser.getLoggedInUserPortalId(req), req.params.id);

      if (recording === null) {
        res.status(404);
        res.render('not-found');
        return;
      }

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

      const recordingPlaybackDataUrl = `/watch-mk/${req.params.id}/playback`;

      res.render('watch-mk', { recording, recordingPlaybackDataUrl });
    } catch (e) {
      res.status(500);
      res.render('error', { status: 500, message: e.message });
    }
  });

  app.get('/watch-mk/:id/playback', requiresAuth(), async (req, res) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.json({ message: 'Not found' });
      return;
    }

    try {
      const client = new PreClient();
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);

      const recordingPlaybackData = await client.getRecordingPlaybackDataMk(userPortalId, req.params.id);

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
