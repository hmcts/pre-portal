import axios from 'axios';
import { SystemStatus } from '../../../../main/services/system-status/system-status';
import { PreClient } from '../../../../main/services/pre-api/pre-client';
import { Application } from 'express';

const preClient = new PreClient();
jest.mock('axios');

/* eslint-disable jest/expect-expect */
describe('SystemStatus BAD', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, data: object, config: object) => {
    // API
    if (url === '/health') {
      return Promise.resolve({
        status: 200,
        data: {
          status: 'DOWN',
          groups: ['liveness', 'readiness'],
          components: {
            db: { status: 'DOWN', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
            discoveryComposite: {
              description: 'Discovery Client not initialized',
              status: 'UNKNOWN',
              components: { discoveryClient: { description: 'Discovery Client not initialized', status: 'UNKNOWN' } },
            },
            diskSpace: {
              status: 'DOWN',
              details: {
                total: 133003395072,
                free: 101203660800,
                threshold: 10485760,
                path: '/opt/app/.',
                exists: true,
              },
            },
            livenessState: { status: 'DOWN' },
            ping: { status: 'DOWN' },
            preApi: {
              status: 'DOWN',
              details: { mediakindConnections: { preingestsastg: false, prefinalsastg: false } },
            },
            readinessState: { status: 'DOWN' },
            refreshScope: { status: 'DOWN' },
          },
        },
      });
    }

    // CVP
    if (url === 'https://status-kinly.pexip.com/api/v2/status.json') {
      return Promise.resolve({
        status: 200,
        data: {
          page: {
            id: 'tjz5jcqrqjzf',
            name: 'Pexip Kinly Services',
            url: 'https://status-kinly.pexip.com',
            time_zone: 'Etc/UTC',
            updated_at: '2024-12-17T08:15:01.281Z',
          },
          status: { indicator: 'none', description: 'All Systems Busted' },
        },
      });
    }

    // GovNotify
    if (url === 'https://status.notifications.service.gov.uk/api/v2/status.json') {
      return Promise.resolve({
        status: 200,
        data: {
          page: {
            id: 'stdg40247zwv',
            name: 'GOV.UK Notify',
            url: 'https://status.notifications.service.gov.uk',
            time_zone: 'Europe/London',
            updated_at: '2024-12-09T12:47:23.801+00:00',
          },
          status: { indicator: 'none', description: 'All Systems Busted' },
        },
      });
    }

    // B2C
    if (url.indexOf('post_logout_redirect_uri') > 0) {
      return Promise.resolve({
        status: 500,
      });
    }
  });

  test('all statuses are bad', async () => {
    const systemStatus = new SystemStatus(preClient, { locals: {} } as Application);
    const status = await systemStatus.getStatus();
    expect(status.api.status).toEqual('DOWN');
    expect(status.api.components.db).toEqual('DOWN');
    expect(status.api.components.preApi).toEqual('DOWN');
    expect(status.api.components.diskSpace).toEqual('DOWN');
    expect(status.api.components.govNotify).toEqual('DOWN');
    expect(status.portal.status).toEqual('DOWN');
    expect(status.portal.components.redis).toEqual('DOWN');
    expect(status.portal.components.b2c).toEqual('DOWN');
    expect(status.mediaKind.status).toEqual('DOWN');
    expect(status.mediaKind.components.storage).toEqual('DOWN');
    expect(status.mediaKind.connections?.preingestsastg).toEqual(false);
    expect(status.mediaKind.connections?.prefinalsastg).toEqual(false);
    expect(status.cvp.status).toEqual('DOWN');
    expect(status.cvp.components.conferencing).toEqual('DOWN');
  });
});
