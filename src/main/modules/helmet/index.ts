import config from 'config';
import * as express from 'express';
import helmet from 'helmet';

const googleAnalyticsDomain = '*.google-analytics.com';
const azureMediaPlayer = 'https://amp.azure.net/libs/amp/2.3.11/';
const self = "'self'";

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  private readonly developmentMode: boolean;
  constructor(developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  public enableFor(app: express.Express): void {
    const azureMediaServices = config.get('ams.azureMediaServices') as string;
    const azureMediaServicesKeyDelivery = config.get('ams.azureMediaServicesKeyDelivery') as string;
    const dynatraceDomain = '*.dynatrace.com';
    const mkPlayer = 'https://mkplayer.azureedge.net';
    const bitmovinLicensing = 'https://licensing.bitmovin.com';

    // include default helmet functions
    const scriptSrc = [self, googleAnalyticsDomain, "'unsafe-inline'", azureMediaPlayer, dynatraceDomain];
    const scriptSrcAttr = [self, "'unsafe-inline'"];

    if (this.developmentMode) {
      // Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval'
      // is not an allowed source of script in the following Content Security Policy directive:
      // "script-src 'self' *.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='".
      // seems to be related to webpack
      scriptSrc.push("'unsafe-eval'");
    }

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            connectSrc: [
              self,
              azureMediaPlayer,
              azureMediaServices,
              azureMediaServicesKeyDelivery,
              dynatraceDomain,
              mkPlayer,
              bitmovinLicensing,
            ],
            defaultSrc: ["'none'"],
            fontSrc: [self, azureMediaPlayer, 'data:'],
            imgSrc: [self, googleAnalyticsDomain, azureMediaPlayer, 'data:'],
            manifestSrc: [self],
            mediaSrc: [self, 'blob:'],
            objectSrc: [self],
            scriptSrc,
            styleSrc: [self, "'unsafe-inline'", azureMediaPlayer],
            scriptSrcAttr,
            workerSrc: [self, 'blob:'],
          },
        },
        referrerPolicy: { policy: 'origin' },
        crossOriginEmbedderPolicy: false,
      })
    );
  }
}
