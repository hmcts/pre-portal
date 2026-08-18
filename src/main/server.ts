#!/usr/bin/env node
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

import { app, appReady } from './app';
import { Logger } from '@hmcts/nodejs-logging';
const appRoot = path.resolve(process.cwd(), 'src/main');

const logger = Logger.getLogger('server');

// TODO: set the right port for your application
const port: number = parseInt(process.env.PORT || '4551', 10);

async function startServer(): Promise<void> {
  await appReady;

  if (app.locals.ENV === 'development') {
    const sslDirectory = path.join(appRoot, 'resources', 'localhost-ssl');
    const sslOptions = {
      cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
      key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
    };
    const server = https.createServer(sslOptions, app);
    server.listen(port, () => {
      logger.info(`Application started: https://localhost:${port}`);
    });
  } else {
    app.listen(port, () => {
      logger.info(`Application started: http://localhost:${port}`);
    });
  }
}

void startServer().catch(error => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
