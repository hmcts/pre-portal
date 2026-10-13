import { Application } from 'express';
import { SessionUser } from '../../services/session-user/session-user';
import { UserLevel } from '../../types/user-level';

export default function (app: Application): void {
  app.get('/cookies', (req, res) => {
    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const isSuperUser = userProfileForCjsm.app_access.some(role => role.role.name === UserLevel.SUPER_USER);

    res.render('utility/cookies', {
      isSuperUser: isSuperUser,
      pageUrl: req.url,
    });
  });
}
