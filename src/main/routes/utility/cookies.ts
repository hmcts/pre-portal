import { Application } from 'express';

export default function (app: Application): void {
  app.get('/cookies', (req, res) => {
    res.render('utility/cookies');
  });
}
