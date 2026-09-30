import os from 'os';

import { PreClient } from '../services/pre-api/pre-client';

import healthcheck from '@hmcts/nodejs-healthcheck';
import { Application } from 'express';
import { Logger } from '@hmcts/nodejs-logging';

export default function (app: Application): void {
  const logger = Logger.getLogger('Health');
  let lastRedisReadiness: 'up' | 'down' | undefined;

  const redis = app.locals.redisClient
    ? healthcheck.raw(async () => {
        try {
          await app.locals.redisClient.ping();

          if (lastRedisReadiness !== 'up') {
            logger.info('Readiness: Redis is UP');
            lastRedisReadiness = 'up';
          }

          return healthcheck.up();
        } catch (err) {
          if (lastRedisReadiness !== 'down') {
            logger.info('Readiness: Redis is DOWN');
            lastRedisReadiness = 'down';
          }

          return healthcheck.down();
        }
      })
    : null;
  healthcheck.addTo(app, {
    checks: {
      // currently no API health check is possible for B2C
      ...(redis ? { redis } : {}),
      'pre-api': async () => {
        return new PreClient()
          .healthCheck()
          .then(r => {
            return r.data.status === 'UP' ? healthcheck.up() : healthcheck.down();
          })
          .catch(healthcheck.down);
      },
    },
    ...(redis
      ? {
          readinessChecks: {
            // allow the frontend to start up without the API but not without redis.
            redis,
          },
        }
      : {}),
    buildInfo: {
      name: 'pre-portal',
      host: os.hostname(),
      uptime: process.uptime(),
    },
  });
}
