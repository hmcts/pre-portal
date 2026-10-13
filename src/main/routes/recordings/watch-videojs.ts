import { PreClient } from '../../services/pre-api/pre-client';
import { SessionUser } from '../../services/session-user/session-user';

import { Logger } from '@hmcts/nodejs-logging';
import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';
import { v4 as uuid } from 'uuid';
import { UserLevel } from '../../types/user-level';

function validateId(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export default function (app: Application): void {
  const logger = Logger.getLogger('watch-videojs');

  app.get('/recordings/watch-videojs/:id', requiresAuth(), async (req, res, next) => {
    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const isSuperUser = userProfileForCjsm.app_access.some(role => role.role.name === UserLevel.SUPER_USER);
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('utility/not-found', {
        isSuperUser: isSuperUser,
        pageUrl: req.url,
      });
      return;
    }

    try {
      const userBrowseId = await SessionUser.getLoggedInUserBrowseId(req);
      const userProfile = SessionUser.getLoggedInUserProfile(req);

      const client = new PreClient();
      const recording = await client.getRecording(userBrowseId, req.params.id);

      if (recording === null) {
        res.status(404);
        res.render('utility/not-found', {
          isSuperUser: isSuperUser,
          pageUrl: req.url,
        });
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

      const recordingPlaybackDataUrl = `/recordings/watch-videojs/${req.params.id}/playback`;
      res.render('recordings/watch-videojs', {
        recording,
        recordingPlaybackDataUrl,
        isSuperUser: isSuperUser,
        pageUrl: req.url,
      });
    } catch (e) {
      next(e);
    }
  });

  app.get('/recordings/watch-videojs/:id/playback', requiresAuth(), async (req, res) => {
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
