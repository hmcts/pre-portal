import { Application } from 'express';

export default function home(app: Application): void {
  app.get('/', (req, res) => {
    // check if user is signed in or not and redirect accordingly
    res.redirect('/browse');
  });
}
