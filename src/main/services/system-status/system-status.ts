import { Logger } from '@hmcts/nodejs-logging';
import { PreClient } from '../pre-api/pre-client';
import { HealthResponse, HealthStatus, SimplifiedHealthResponse } from '../../types/health';
import axios from 'axios';
import { Application } from 'express';
import config from 'config';

export class SystemStatus {
  logger = Logger.getLogger('system-status');

  private readonly client: PreClient;
  private readonly app: Application;

  constructor(client: PreClient, app: Application) {
    this.client = client;
    this.app = app;
  }

  async getStatus() {
    const health = (await this.client.healthCheck()).data;
    const status = this.getDefaultStatuses();
    status.api.components = await this.getApiComponentStatus(health);
    status.mediaKind.connections = this.getMediaKindConnectionStatuses(health);
    status.mediaKind.components = this.getMediaKindComponentStatuses(status.mediaKind.connections);
    status.cvp.components.conferencing = await this.getCVPStatus();
    status.portal.components.redis = this.getRedisStatus();
    status.portal.components.b2c = await this.getB2CStatus();

    Object.values(status).forEach(service => {
      const serviceStatuses = Object.values(service.components);

      if (serviceStatuses.every(s => s === 'UP')) {
        service.status = 'OPERATIONAL';
      } else if (serviceStatuses.some(s => s === 'UP')) {
        service.status = 'DEGRADED';
      }
    });

    return status;
  }

  private async getApiComponentStatus(health: HealthResponse) {
    return {
      db: health.components.db.status,
      preApi: health.components.preApi.status,
      diskSpace: health.components.diskSpace.status,
      govNotify: await this.getGovNotifyStatus(),
    };
  }

  private getMediaKindConnectionStatuses(health: HealthResponse) {
    return health.components.preApi.details?.mediakindConnections;
  }

  private getMediaKindComponentStatuses(connections) {
    if (Object.values(connections).every(c => c)) {
      return { storage: 'UP' as HealthStatus };
    }
    return { storage: 'DOWN' as HealthStatus };
  }

  private async getCVPStatus() {
    return this.commonThirdPartyStatusCheck(config.get('health.cvp'));
  }

  private getGovNotifyStatus() {
    return this.commonThirdPartyStatusCheck(config.get('health.notify'));
  }

  private async commonThirdPartyStatusCheck(url: string): Promise<HealthStatus> {
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const description = response.data?.status?.description;

      if (description === 'All Systems Operational') {
        return 'UP' as HealthStatus;
      }
      return 'DOWN' as HealthStatus;
    } catch (error) {
      console.error('Error fetching 3rd party status url(' + url + '):', error);
      return 'UNKNOWN' as HealthStatus;
    }
  }

  private getRedisStatus() {
    if (this.app.locals.redisClient) {
      return this.app.locals.redisClient
        .ping()
        .then(() => {
          return 'UP' as HealthStatus;
        })
        .catch(() => {
          return 'DOWN' as HealthStatus;
        });
    }
    return 'DOWN' as HealthStatus;
  }

  private async getB2CStatus() {
    const b2cUrl =
      (config.get('b2c.endSessionEndpoint') as string) + '?post_logout_redirect_uri=' + config.get('pre.portalUrl');

    try {
      const response = await axios.get(b2cUrl);

      if (response.status === 200) {
        return 'UP' as HealthStatus;
      }
      return 'DOWN' as HealthStatus;
    } catch (error) {
      this.logger.error(`Failed to reach B2C endpoint: ${b2cUrl}`, {
        error: error instanceof Error ? error.message : error,
      });
      return 'UNKNOWN' as HealthStatus;
    }
  }

  private getDefaultStatuses(): SimplifiedHealthResponse {
    return {
      api: {
        status: 'DOWN',
        components: {
          db: 'DOWN',
          preApi: 'DOWN',
          diskSpace: 'DOWN',
          govNotify: 'DOWN',
        },
      },
      portal: {
        status: 'DOWN',
        components: {
          redis: 'DOWN',
          b2c: 'DOWN',
        },
      },
      mediaKind: {
        status: 'DOWN',
        components: {
          storage: 'DOWN',
        },
        connections: {},
      },
      cvp: {
        status: 'DOWN',
        components: {
          conferencing: 'DOWN',
        },
      },
    };
  }
}
