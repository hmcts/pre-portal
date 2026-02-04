import { RedisService } from '../../app/redis/RedisService';
import { PreClient } from '../../services/pre-api/pre-client';

import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import { Application } from 'express';
import { ConfigParams, auth } from 'express-openid-connect';
import session from 'express-session';
import * as jose from 'jose';
import FileStoreFactory from 'session-file-store';

const FileStore = FileStoreFactory(session);
import { RedisStore } from 'connect-redis';

export class Auth {
  public enableFor(app: Application): void {
    const logger = Logger.getLogger('auth-module');

    // https://auth0.github.io/express-openid-connect/interfaces/ConfigParams.html
    app.use(auth(this.getConfigParams(app, logger)));
  }

  private getConfigParams(app: Application, logger: Logger): ConfigParams {
    return {
      authRequired: false,
      attemptSilentLogin: false,
      idpLogout: true,
      secret: config.get('session.secret') as string,
      baseURL: config.get('pre.portalUrl') as string,
      clientID: config.get('b2c.appClientId') as string,
      issuerBaseURL: config.get('b2c.baseUrl') as string,
      clientAuthMethod: 'client_secret_post',
      clientSecret: config.get('b2c.appClientSecret') as string,
      authorizationParams: {
        response_type: 'id_token',
        scope: 'openid email profile',
        redirect_uri: `${config.get('pre.portalUrl')}/callback`,
      },
      routes: {
        postLogoutRedirect: ((config.get('b2c.endSessionEndpoint') as string) +
          '?post_logout_redirect_uri=' +
          config.get('pre.portalUrl')) as string,
      },
      afterCallback: async (req, res, s) => {
        const claims = jose.decodeJwt(s.id_token);
        // if loginEmail is set, use that, else use email
        const loggedInEmail = claims.loginEmail || claims.email;
        // @todo add jwt validation here

        // check if the user is a new user
        const client = new PreClient();
        return {
          ...s,
          userProfile: await client.getUserByClaimEmail(loggedInEmail as string),
        };
      },
      session: {
        name: '__session',
        rollingDuration: config.get('session.maxAge') as number,
        cookie: {
          httpOnly: true,
          sameSite: 'Lax', // required for the oauth2 redirect
          secure: true,
        },
        rolling: true, // Renew the cookie for another `rollingDuration` minutes on each request
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        store: this.getSessionStore(app, logger) as any, // https://github.com/auth0/express-openid-connect/issues/234
      },
    };
  }

  private getSessionStore(app: Application, logger: Logger) {
    const redisHost = config.get('session.redis.host');
    logger.info('Redis host: {}', redisHost);
    if (redisHost) {
      const client = new RedisService().getClient(
        config.get('session.redis.host'),
        config.get('session.redis.key'),
        logger
      );
      app.locals.redisClient = client;
      return new RedisStore({ client });
    }

    return new FileStore({ path: '/tmp' });
  }
}
