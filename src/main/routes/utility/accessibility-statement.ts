import { Application } from 'express';

export default function accessibilityStatement(app: Application): void {
  app.get('/accessibility-statement', (req, res) => {
    res.render('utility/accessibility-statement');
  });
}
