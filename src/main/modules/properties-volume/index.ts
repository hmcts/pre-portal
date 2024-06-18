import { Logger } from '@hmcts/nodejs-logging';
import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import { get, set } from 'lodash';

export class PropertiesVolume {
  private logger = Logger.getLogger('properties-volume');

  enableFor(server: Application): void {
    set(config, 'pre.portalUrl', process.env.PORTAL_URL ?? 'https://localhost:4551');
    set(config, 'pre.apiUrl', process.env.PRE_API_URL ?? 'https://localhost:4550');
    set(config, 'session.redis.host', process.env.REDIS_HOST ?? '');
    set(config, 'b2c.appClientId', process.env.B2C_APP_CLIENT_ID ?? 'c8deb898-d595-4fb2-8ba5-52fffa8db064');
    set(
      config,
      'b2c.baseUrl',
      process.env.B2C_BASE_URL ??
        'https://hmctsdevextid.b2clogin.com/hmctsdevextid.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=B2C_1A_SIGNUP_SIGNIN'
    );
    set(
      config,
      'b2c.endSessionEndpoint',
      process.env.B2C_END_SESSION_ENDPOINT ??
        'https://hmctsdevextid.b2clogin.com/hmctsdevextid.onmicrosoft.com/b2c_1a_signup_signin/oauth2/v2.0/logout'
    );
    set(
      config,
      'ams.azureMediaServices',
      process.env.AMS_AZURE_MEDIA_SERVICES ?? 'https://preamstest-ukso1.streaming.media.azure.net'
    );
    set(
      config,
      'ams.azureMediaServicesKeyDelivery',
      process.env.AMS_AZURE_MEDIA_SERVICES_KEY_DELIVERY ?? 'https://preamstest.keydelivery.uksouth.media.azure.net'
    );
    set(config, 'pre.enableMkWatchPage', process.env.ENABLE_MK_WATCH_PAGE ?? 'false');

    if (server.locals.ENV === 'production') {
      this.logger.info('Loading properties from mounted KV');
      propertiesVolume.addTo(config);
      this.setSecret('secrets.pre-hmctskv.AppInsightsInstrumentationKey', 'appInsights.instrumentationKey');
      this.setSecret('secrets.pre-hmctskv.redis6-access-key', 'session.redis.key');
      this.setSecret('secrets.pre-hmctskv.session-secret', 'session.secret');
      this.setSecret('secrets.pre-hmctskv.apim-sub-portal-primary-key', 'pre.apiKey.primary');
      this.setSecret('secrets.pre-hmctskv.apim-sub-portal-primary-key', 'pre.primaryApiKey');
      this.setSecret('secrets.pre-hmctskv.apim-sub-portal-secondary-key', 'pre.apiKey.secondary');
      this.setSecret('secrets.pre-hmctskv.pp-authorization', 'ams.flowKey');
      this.setSecret('secrets.pre-hmctskv.ams-flow-url', 'ams.flowUrl');
      this.setSecret('secrets.pre-hmctskv.pre-portal-sso', 'b2c.appClientSecret');
      this.setSecret('secrets.pre-hmctskv.b2c-test-login-email', 'b2c.testLogin.email');
      this.setSecret('secrets.pre-hmctskv.b2c-test-login-password', 'b2c.testLogin.password');
    } else {
      this.logger.info('Loading properties from .env file');
      require('dotenv').config();
      set(config, 'pre.apiKey.primary', process.env.APIM_SUB_PORTAL_PRIMARY_KEY ?? 'pre.apiKey.primary');
      set(config, 'pre.apiKey.secondary', process.env.APIM_SUB_PORTAL_SECONDARY_KEY ?? 'pre.apiKey.secondary');
      set(config, 'ams.flowKey', process.env.PP_AUTHORIZATION);
      set(config, 'ams.flowUrl', process.env.AMS_FLOW_URL);
      set(config, 'b2c.appClientSecret', process.env.B2C_APP_CLIENT_SECRET ?? 'b2c.appClientSecret');
      set(config, 'b2c.testLogin.email', process.env.B2C_TEST_LOGIN_EMAIL);
      set(config, 'b2c.testLogin.password', process.env.B2C_TEST_LOGIN_PASSWORD);
      set(config, 'session.secret', process.env.SESSION_SECRET ?? 'superlongrandomstringthatshouldbebetterinprod');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }
}
