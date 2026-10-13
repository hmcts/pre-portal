import { Application } from 'express';

export default function cookies(app: Application): void {
  app.get('/cookies', (req, res) => {
    res.render('utility/cookies');
  });
}
