import * as express from 'express';
import helmet from 'helmet';

const googleAnalyticsDomain = '*.google-analytics.com';
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
    const dynatraceDomain = 'https://*.dynatrace.com';
    const mkPlayer = 'https://mkplayer.azureedge.net';
    const bitmovinLicensing = 'https://licensing.bitmovin.com';
    const mkStreaming = '*.uksouth.streaming.mediakind.com';
    const mkStreamingUKS4 = '*.uksouth-4.streaming.mediakind.com';
    const mkLicense = 'ottapp-appgw-amp.prodc.mkio.tv3cloud.com';

    // include default helmet functions
    const scriptSrc = [self, googleAnalyticsDomain, "'unsafe-inline'", dynatraceDomain];
    const scriptSrcAttr = [self, "'unsafe-inline'", dynatraceDomain];

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
              dynatraceDomain,
              mkPlayer,
              bitmovinLicensing,
              mkStreaming,
              mkStreamingUKS4,
              mkLicense,
              'data:',
            ],
            defaultSrc: ["'none'"],
            fontSrc: [self, 'data:'],
            imgSrc: [self, googleAnalyticsDomain, dynatraceDomain, 'data:'],
            manifestSrc: [self],
            mediaSrc: [self, 'blob:', 'data:', mkLicense, mkStreaming],
            objectSrc: [self],
            scriptSrc,
            styleSrc: [self, "'unsafe-inline'"],
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
