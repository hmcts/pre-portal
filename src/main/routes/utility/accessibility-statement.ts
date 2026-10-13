import { Application } from 'express';

export default function (app: Application): void {
  app.get('/accessibility-statement', (req, res) => {
    res.render('utility/accessibility-statement');
  });
}
