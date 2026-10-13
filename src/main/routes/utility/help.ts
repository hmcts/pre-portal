import { Application } from 'express';

export default function helpRoute(app: Application): void {
  app.get('/help', (req, res) => {
    res.render('utility/help', { isSuperUser: false });
  });
}
