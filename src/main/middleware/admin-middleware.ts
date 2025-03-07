import { Request, Response, NextFunction } from 'express';
import { UserLevel } from '../types/user-level';
import { SessionUser } from '../services/session-user/session-user';

export function RequiresSuperUser(req: Request, res: Response, next: NextFunction) {
  const isSuperUser = SessionUser.getLoggedInUserProfile(req).app_access.some(
    role => role.role.name === UserLevel.SUPER_USER
  );

  if (!isSuperUser) {
    res.status(404);
    return res.render('not-found');
  }

  next();
}
