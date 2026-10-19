import { Application } from 'express';
import { SessionUser } from '../../services/session-user/session-user';

export default function reports(app: Application): void {
  app.get('/management/reports', (req, res) => {
    res.render('utility/under-development', {
      isSuperUser: SessionUser.isLoggedInSuperUser(req),
      pageUrl: req.url,
    });
  });
}
