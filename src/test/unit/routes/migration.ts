jest.mock('../../../main/services/pre-api/pre-client', () => {
  return {
    PreClient: jest.fn().mockImplementation(() => ({
      getCourts: jest.fn().mockResolvedValue([{ id: '123', name: 'Birmingham Youth Court' }]),
    })),
  };
});

import { Nunjucks } from '../../../main/modules/nunjucks';
import { beforeAll, describe, test } from '@jest/globals';
import { MigrationRecordService } from '../../../main/services/system-status/migration-status';
import { mockeduser } from '../test-helper';
import { UserLevel } from '../../../main/types/user-level';

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        next();
      };
    }),
  };
});

jest.mock('../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation(() => '123'),
      getLoggedInUserProfile: jest.fn().mockImplementation(() => mockeduser),
    },
  };
});

jest.mock('../../../main/services/system-status/migration-status');

describe('Migration route', () => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  test('should display migration page for super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const migration = require('../../../main/routes/admin/migration').default;
    migration(app);

    MigrationRecordService.prototype.getMigrationRecords = jest.fn().mockResolvedValue({
      migrationRecords: [
        {
          archiveId: 'ARCH-002',
          urn: 'URN654321',
          court: 'Birmingham Youth',
          exhibitReference: 'EX456',
          witnessName: 'Zaheera',
          defendantName: 'Brown',
          recordingVersion: 'ORIG',
          reasonIn: 'Not_Most_Recent',
          reason: '',
          status: 'Unresolved',
          createDate: '10/12/2023',
        },
      ],
      pagination: {
        currentPage: 0,
        totalPages: 1,
        totalElements: 1,
        size: 20,
      },
    });

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/admin/migration');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('Migration');
    expect(response.text).toContain('submit');
  });

  test('should display "Page Not Found" for non-super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const migration = require('../../../main/routes/admin/migration').default;
    migration(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/migration');

    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
