import { describe, expect, test, vi } from 'vitest';
import axios from 'axios';
import { SystemStatus } from '../../../../main/services/system-status/system-status';
import { PreClient } from '../../../../main/services/pre-api/pre-client';
import { Application } from 'express';

const preClient = new PreClient();
vi.mock('axios');

/* eslint-disable vitest/expect-expect */
describe('SystemStatus GOOD', () => {
  const mockedAxios = axios as any;

  // @ts-ignore
  mockedAxios.get.mockImplementation((url: string, _data: object, _config: object) => {
    // API
    if (url === '/health') {
      return Promise.resolve({
        status: 200,
        data: {
          status: 'UP',
          groups: ['liveness', 'readiness'],
          components: {
            db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
            discoveryComposite: {
              description: 'Discovery Client not initialized',
              status: 'UNKNOWN',
              components: { discoveryClient: { description: 'Discovery Client not initialized', status: 'UNKNOWN' } },
            },
            diskSpace: {
              status: 'UP',
              details: {
                total: 133003395072,
                free: 101203660800,
                threshold: 10485760,
                path: '/opt/app/.',
                exists: true,
              },
            },
            livenessState: { status: 'UP' },
            ping: { status: 'UP' },
            preApi: { status: 'UP', details: { mediakindConnections: { preingestsastg: true, prefinalsastg: true } } },
            readinessState: { status: 'UP' },
            refreshScope: { status: 'UP' },
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
          status: { indicator: 'none', description: 'All Systems Operational' },
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
          status: { indicator: 'none', description: 'All Systems Operational' },
        },
      });
    }

    // B2C
    if (url.indexOf('post_logout_redirect_uri') > 0) {
      return Promise.resolve({
        status: 200,
      });
    }
  });

  test('all statuses are ok', async () => {
    const systemStatus = new SystemStatus(preClient, { locals: {} } as Application);
    const status = await systemStatus.getStatus();
    expect(status.api.status).toEqual('OPERATIONAL');
    expect(status.api.components.db).toEqual('UP');
    expect(status.api.components.preApi).toEqual('UP');
    expect(status.api.components.diskSpace).toEqual('UP');
    expect(status.api.components.govNotify).toEqual('UP');
    expect(status.portal.status).toEqual('DEGRADED');
    expect(status.portal.components.redis).toEqual('DOWN');
    expect(status.portal.components.b2c).toEqual('UP');
    expect(status.mediaKind.status).toEqual('OPERATIONAL');
    expect(status.mediaKind.components.storage).toEqual('UP');
    expect(status.mediaKind.connections?.preingestsastg).toEqual(true);
    expect(status.mediaKind.connections?.prefinalsastg).toEqual(true);
    expect(status.cvp.status).toEqual('OPERATIONAL');
    expect(status.cvp.components.conferencing).toEqual('UP');
  });
});
