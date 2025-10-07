import * as path from 'path';

import { AppInsights } from './modules/appinsights/index.js';
import { Auth } from './modules/auth/index.js';
import { Helmet } from './modules/helmet/index.js';
import { Nunjucks } from './modules/nunjucks/index.js';
import { PropertiesVolume } from './modules/properties-volume/index.js';
import { ForbiddenError, HTTPError, TermsNotAcceptedError, UnauthorizedError } from './types/errors.js';

import axios from 'axios';
import bodyParser from 'body-parser';
import config from 'config';
import cookieParser from 'cookie-parser';
import express from 'express';
import { glob } from 'glob';
import favicon from 'serve-favicon';

import 'dotenv/config';
import { setupDev } from './development.js';
import { Logger } from '@hmcts/nodejs-logging';

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

export const app = express();
app.locals.ENV = env;
process.env.ALLOW_CONFIG_MUTATIONS = 'true';

const logger = Logger.getLogger('app');

new PropertiesVolume().enableFor(app);
new AppInsights().enable();
new Nunjucks(developmentMode).enableFor(app);
// secure the application by adding various HTTP headers to its responses
new Helmet(developmentMode).enableFor(app);

logger.info('Setting PRE API url to: ' + config.get('pre.apiUrl'));

axios.defaults.baseURL = config.get('pre.apiUrl');
axios.defaults.headers.common['Ocp-Apim-Subscription-Key'] = config.get('pre.apiKey.primary');
axios.defaults.headers.post['Content-Type'] = 'application/json';

app.use(favicon(path.join(process.cwd(), 'src', 'main', 'public', 'assets', 'images', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'src', 'main', 'public')));
if (process.env.PORTAL_AUTH_DISABLED !== '1') {
  logger.info('Enabling Auth. Env: ' + env);
  new Auth().enableFor(app);
} else {
  logger.warn('Disabling Auth PORTAL_AUTH_DISABLED === ' + process.env.PORTAL_AUTH_DISABLED);
}

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

export const appReady = (async () => {
  const routeFiles = glob.sync(path.join(process.cwd(), 'src', 'main', 'routes', '**', '*.+(ts|js)'));
  const routeModules = await Promise.all(routeFiles.map(filename => import(filename)));
  routeModules.forEach(mod => mod.default(app));

  await setupDev(app, developmentMode);
  // returning "not found" page for requests with paths not resolved by the router
  app.use((req, res) => {
    res.status(404);
    res.render('not-found');
  });

  // error handler
  app.use((err: HTTPError, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.message);

    if (err instanceof TermsNotAcceptedError) {
      res.redirect('/accept-terms-and-conditions');
      return;
    }

    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      res.redirect('/');
      return;
    }

    res.status(err.status ?? 500);
    res.render('error', { status: err.status, message: err.message });
  });
})();
