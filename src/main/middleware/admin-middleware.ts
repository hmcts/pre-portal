import { Request, Response, NextFunction } from 'express';
import { SessionUser } from '../services/session-user/session-user';

export function RequiresSuperUser(req: Request, res: Response, next: NextFunction) {
  if (!SessionUser.isLoggedInSuperUser(req)) {
    res.status(404);
    return res.render('utility/not-found');
  }

  next();
}
