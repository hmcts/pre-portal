import config from 'config';
import { Logger } from '@hmcts/nodejs-logging';

const appInsights = require('applicationinsights');

export class AppInsights {
  private logger = Logger.getLogger('ApplicationInsights');

  enable(): void {
    console.time('startup:app-insights');
    this.logger.info('Enabling Application Insights');
    if (config.get('appInsights.app-insights-connection-string')) {
      appInsights
        .setup(config.get('appInsights.app-insights-connection-string'))
        .setSendLiveMetrics(true)
        .setAutoCollectConsole(true, true)
        .setAutoCollectExceptions(true)
        .start();

      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'pre-portal';
      appInsights.defaultClient.trackTrace({
        message: 'App insights activated',
      });
    }
    this.logger.info('Application Insights enabled');
    console.timeEnd('startup:app-insights');
  }
}
