import { Nunjucks } from '../../../../main/modules/nunjucks';
import { beforeAll, describe, test } from '@jest/globals';
import { SystemStatus } from '../../../../main/services/system-status/system-status';
import { mockeduser, mockUser } from '../../test-helper';
import { UserLevel } from '../../../../main/types/user-level';
import express from 'express';
import request from 'supertest';
import statusRoute from '../../../../main/routes/system/status';

mockUser();

jest.mock('../../../../main/services/system-status/system-status');

describe('Admin Status route', () => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  test('should display status page for super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    statusRoute(app);

    (SystemStatus.prototype.getStatus as jest.Mock).mockResolvedValue({ status: 'ok' });

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/system/status');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Admin');
    expect(response.text).toContain('Status');
    expect(response.text).toContain('Components');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    statusRoute(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/system/status');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
