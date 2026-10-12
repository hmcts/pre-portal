import { Application } from 'express';
import {UserLevel} from "../../types/user-level";
import {SessionUser} from "../../services/session-user/session-user";

export default function (app: Application): void {
  app.get('/management/reports', (req, res) => {
    const userProfileForCjsm = SessionUser.getLoggedInUserProfile(req);
    const isSuperUser = userProfileForCjsm.app_access
      .some(role => role.role.name === UserLevel.SUPER_USER);
    res.render('utility/under-development', {
      isSuperUser: isSuperUser,
      pageUrl: req.url,
    });
  })}
