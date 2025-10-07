import { Logger } from '@hmcts/nodejs-logging';
import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import _ from 'lodash';
import * as process from 'node:process';
import 'dotenv/config';

export class PropertiesVolume {
  private logger = Logger.getLogger('properties-volume');

  enableFor(server: Application): void {
    _.set(config, 'pre.portalUrl', process.env.PORTAL_URL ?? 'https://localhost:4551');
    _.set(config, 'pre.apiUrl', process.env.PRE_API_URL ?? 'https://localhost:4550');
    _.set(config, 'session.redis.host', process.env.REDIS_HOST ?? '');
    _.set(config, 'b2c.appClientId', process.env.B2C_APP_CLIENT_ID ?? 'd20a7462-f222-46b8-a363-d2e30eb274eb');
    _.set(
      config,
      'b2c.baseUrl',
      process.env.B2C_BASE_URL ??
        'https://hmctsstgextid.b2clogin.com/hmctsstgextid.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=B2C_1A_SIGNUP_SIGNIN'
    );
    _.set(
      config,
      'b2c.endSessionEndpoint',
      process.env.B2C_END_SESSION_ENDPOINT ??
        'https://hmctsstgextid.b2clogin.com/hmctsstgextid.onmicrosoft.com/b2c_1a_signup_signin/oauth2/v2.0/logout'
    );

    if (server.locals.ENV === 'production') {
      this.logger.info('Loading properties from mounted KV');
      propertiesVolume.addTo(config);
      this.setSecret(
        'secrets.pre-hmctskv.app-insights-connection-string',
        'appInsights.app-insights-connection-string'
      );
      this.setSecret('secrets.pre-hmctskv.redis6-access-key', 'session.redis.key');
      this.setSecret('secrets.pre-hmctskv.session-secret', 'session.secret');
      this.setSecret('secrets.pre-hmctskv.apim-sub-portal-primary-key', 'pre.apiKey.primary');
      this.setSecret('secrets.pre-hmctskv.apim-sub-portal-primary-key', 'pre.primaryApiKey');
      this.setSecret('secrets.pre-hmctskv.apim-sub-portal-secondary-key', 'pre.apiKey.secondary');
      this.setSecret('secrets.pre-hmctskv.media-kind-player-key', 'pre.mediaKindPlayerKey');

      if (process.env.USE_DEV_B2C === 'true') {
        this.logger.info('Using dev B2C configuration');
        this.setSecret('secrets.pre-hmctskv.dev-pre-portal-sso', 'b2c.appClientSecret');
      } else {
        this.setSecret('secrets.pre-hmctskv.pre-portal-sso', 'b2c.appClientSecret');
      }
      this.setSecret('secrets.pre-hmctskv.b2c-test-login-email', 'b2c.testLogin.email');
      this.setSecret('secrets.pre-hmctskv.b2c-test-login-password', 'b2c.testLogin.password');
      this.setSecret('secrets.pre-hmctskv.b2c-test-super-user-email', 'b2c.testSuperUserLogin.email');
      this.setSecret('secrets.pre-hmctskv.b2c-test-super-user-password', 'b2c.testSuperUserLogin.password');
    } else {
      this.logger.info('Loading properties from .env file');
      _.set(config, 'pre.apiKey.primary', process.env.APIM_SUB_PORTAL_PRIMARY_KEY ?? 'pre.apiKey.primary');
      _.set(config, 'pre.apiKey.secondary', process.env.APIM_SUB_PORTAL_SECONDARY_KEY ?? 'pre.apiKey.secondary');
      _.set(config, 'b2c.appClientSecret', process.env.B2C_APP_CLIENT_SECRET ?? 'b2c.appClientSecret');
      _.set(config, 'b2c.testLogin.email', process.env.B2C_TEST_LOGIN_EMAIL);
      _.set(config, 'b2c.testLogin.password', process.env.B2C_TEST_LOGIN_PASSWORD);
      _.set(config, 'b2c.testSuperUserLogin.email', process.env.B2C_TEST_SUPER_USER_LOGIN_EMAIL);
      _.set(config, 'b2c.testSuperUserLogin.password', process.env.B2C_TEST_SUPER_USER_LOGIN_PASSWORD);
      _.set(config, 'session.secret', process.env.SESSION_SECRET ?? 'superlongrandomstringthatshouldbebetterinprod');
      _.set(config, 'pre.mediaKindPlayerKey', process.env.MEDIA_KIND_PLAYER_KEY ?? 'mediaKindPlayerKey');
    }
    // set the dynatrace tag to be available in templates if set
    server.locals.dynatrace_jstag = process.env.DYNATRACE_JSTAG ?? '';

    this.logger.info('Redis host: {}', process.env.REDIS_HOST);
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      _.set(config, toPath, _.get(config, fromPath));
    }
  }
}
