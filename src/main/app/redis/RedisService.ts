import { Logger } from '@hmcts/nodejs-logging';
import * as redis from 'redis';

export class RedisService {
  private logger = Logger.getLogger('RedisService');

  public getClient(host: string, key: string, logger: Logger): unknown {
    logger.info('Redis host: {}', host);
    const client = redis.createClient({
      socket: {
        host,
        port: 6380,
        connectTimeout: 15000,
        tls: true,
      },
      password: key,
    });

    client.connect().catch(this.logger.error);
    return client;
  }
}
