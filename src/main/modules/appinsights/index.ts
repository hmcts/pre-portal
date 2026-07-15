import config from 'config';

const appInsights = require('applicationinsights');

export class AppInsights {
  enable(): void {
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
  }
}
