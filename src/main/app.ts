import * as path from 'path';

import { AppInsights } from './modules/appinsights';
import { Auth } from './modules/auth';
import { Helmet } from './modules/helmet';
import { Nunjucks } from './modules/nunjucks';
import { PropertiesVolume } from './modules/properties-volume';
import { ForbiddenError, HTTPError, TermsNotAcceptedError, UnauthorizedError } from './types/errors';

import axios from 'axios';
import * as bodyParser from 'body-parser';
import config = require('config');
import cookieParser from 'cookie-parser';
import express from 'express';
import { glob } from 'glob';
import favicon from 'serve-favicon';

import 'dotenv/config';

const { setupDev } = require('./development');

const { Logger } = require('@hmcts/nodejs-logging');

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

app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
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

glob
  .sync(__dirname + '/routes/**/*.+(ts|js)')
  .map(filename => require(filename))
  .forEach(route => route.default(app));

setupDev(app, developmentMode);
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
