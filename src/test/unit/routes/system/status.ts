import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi, beforeAll } from 'vitest';
import { Nunjucks } from '../../../../main/modules/nunjucks';
import { mockeduser } from '../../test-helper';
import { UserLevel } from '../../../../main/types/user-level';
import axios from 'axios';

vi.mock('express-openid-connect', () => ({
  requiresAuth: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
}));

vi.mock('../../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    getLoggedInUserPortalId: vi.fn().mockReturnValue('123'),
    getLoggedInUserProfile: vi.fn().mockReturnValue(mockeduser),
  },
}));

vi.mock('axios');

const registerRoute = async (app: express.Express) => {
  const { default: adminStatus } = await import('../../../../main/routes/system/status');
  adminStatus(app);
};

describe('Admin Status route', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

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

  test('should display status page for super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    await registerRoute(app);
    const response = await request(app).get('/system/status');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('Admin');
    expect(response.text).toContain('Status');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/system/status');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
