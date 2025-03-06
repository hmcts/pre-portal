import { Application } from 'express';

export default function (app: Application): void {
  app.get('/help', (req, res) => {
    res.render('help');
  });
}
