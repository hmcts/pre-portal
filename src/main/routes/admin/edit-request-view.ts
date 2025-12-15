import { SessionUser } from '../../services/session-user/session-user';
import { PreClient } from '../../services/pre-api/pre-client';
import { validateId, getCurrentEditRequest, isFlagEnabled } from '../../utils/helpers';

import { Application } from 'express';
import { requiresAuth } from 'express-openid-connect';

export default (app: Application): void => {
  if (!isFlagEnabled('pre.enableAutomatedEditing')) {
    return;
  }

  app.get('/edit-request/:id/view', requiresAuth(), async (req, res, next) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);
      const client = new PreClient();

      const recording = await client.getRecording(userPortalId, req.params.id);
      if (recording === null) {
        res.status(404);
        res.render('not-found');
        return;
      }

      const editRequest = await getCurrentEditRequest(client, userPortalId, req.params.id);
      if (editRequest === null) {
        res.status(404);
        res.render('not-found');
        return;
      }

      res.render('edit-request-view', {
        recording,
        editRequest,
        postUrl: `/edit-request/${recording.id}/submit`,
      });
    } catch (e) {
      next(e);
    }
  });

  app.post('/edit-request/:id/submit', requiresAuth(), async (req, res, next) => {
    if (!validateId(req.params.id)) {
      res.status(404);
      res.render('not-found');
      return;
    }

    try {
      const client = new PreClient();
      const userPortalId = await SessionUser.getLoggedInUserPortalId(req);

      await client.putEditRequest(userPortalId, req.body);
      res.send();
    } catch (e) {
      next(e);
    }
  });
};
