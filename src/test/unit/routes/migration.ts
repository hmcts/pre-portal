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
      records: [
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
        {
          archiveId: 'ARCH-003',
          urn: 'URN654123',
          court: 'York Crown Court',
          exhibitReference: 'EX457',
          witnessName: 'Sherry',
          defendantName: 'Green',
          recordingVersion: 'ORIG',
          reasonIn: '',
          reason: '',
          status: 'READY',
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
  test('PUT /admin/migration/:id should update migration record successfully', async () => {
    const express = require('express');
    const app = express();
    app.use(express.json());

    new Nunjucks(false).enableFor(app);
    const migration = require('../../../main/routes/admin/migration').default;
    migration(app);

    mockeduser.app_access = [
      {
        active: true,
        court: {
          id: 'court-1',
          name: 'Birmingham Youth Court',
          court_type: 'Youth',
          location_code: 'BYC',
          regions: [{ name: 'West Midlands' }],
          rooms: [],
        },
        id: 'access-1',
        last_access: null,
        role: {
          id: 'role-123',
          name: UserLevel.SUPER_USER,
          description: 'Super user role',
          permissions: [],
        },
      },
    ];

    const mockRecordId = 'record-123';
    MigrationRecordService.prototype.updateMigrationRecord = jest.fn().mockResolvedValue(undefined);

    const request = require('supertest');
    const response = await request(app).put(`/admin/migration/${mockRecordId}`).send({ status: 'READY' });

    expect(response.status).toEqual(204);
    expect(MigrationRecordService.prototype.updateMigrationRecord).toHaveBeenCalledWith(mockRecordId, {
      status: 'READY',
    });
  });

  test('PUT /admin/migration/:id should return 400 when update fails', async () => {
    const express = require('express');
    const app = express();
    app.use(express.json());

    new Nunjucks(false).enableFor(app);
    const migration = require('../../../main/routes/admin/migration').default;
    migration(app);

    mockeduser.app_access = [
      {
        active: true,
        court: {
          id: 'court-1',
          name: 'Birmingham Youth Court',
          court_type: 'Youth',
          location_code: 'BYC',
          regions: [{ name: 'West Midlands' }],
          rooms: [],
        },
        id: 'access-1',
        last_access: null,
        role: {
          id: 'role-123',
          name: UserLevel.SUPER_USER,
          description: 'Super user role',
          permissions: [],
        },
      },
    ];

    const mockRecordId = 'record-123';
    MigrationRecordService.prototype.updateMigrationRecord = jest.fn().mockRejectedValue({
      response: { status: 400, data: { message: 'Bad request' } },
    });

    const request = require('supertest');
    const response = await request(app).put(`/admin/migration/${mockRecordId}`).send({ status: 'READY' });

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual({ message: 'Bad request' });
  });

  test('POST /admin/migration/submit should submit migration records successfully', async () => {
    const express = require('express');
    const app = express();
    app.use(express.json());

    new Nunjucks(false).enableFor(app);
    const migration = require('../../../main/routes/admin/migration').default;
    migration(app);

    mockeduser.app_access = [
      {
        active: true,
        court: {
          id: 'court-1',
          name: 'Birmingham Youth Court',
          court_type: 'Youth',
          location_code: 'BYC',
          regions: [{ name: 'West Midlands' }],
          rooms: [],
        },
        id: 'access-1',
        last_access: null,
        role: {
          id: 'role-123',
          name: UserLevel.SUPER_USER,
          description: 'Super user role',
          permissions: [],
        },
      },
    ];

    MigrationRecordService.prototype.submitMigrationRecords = jest.fn().mockResolvedValue({ undefined });

    const request = require('supertest');
    const response = await request(app).post('/admin/migration/submit');

    expect(response.status).toEqual(204);
    expect(MigrationRecordService.prototype.submitMigrationRecords).toHaveBeenCalled();
  });

  test('POST /admin/migration/submit should return 500 when submission fails', async () => {
    const express = require('express');
    const app = express();
    app.use(express.json());

    new Nunjucks(false).enableFor(app);
    const migration = require('../../../main/routes/admin/migration').default;
    migration(app);

    mockeduser.app_access = [
      {
        active: true,
        court: {
          id: 'court-1',
          name: 'Birmingham Youth Court',
          court_type: 'Youth',
          location_code: 'BYC',
          regions: [{ name: 'West Midlands' }],
          rooms: [],
        },
        id: 'access-1',
        last_access: null,
        role: {
          id: 'role-123',
          name: UserLevel.SUPER_USER,
          description: 'Super user role',
          permissions: [],
        },
      },
    ];

    MigrationRecordService.prototype.submitMigrationRecords = jest.fn().mockRejectedValue({
      response: { status: 500, data: { message: 'Server error' } },
    });

    const request = require('supertest');
    const response = await request(app).post('/admin/migration/submit');

    expect(response.status).toEqual(500);
    expect(response.body.error).toEqual({ message: 'Server error' });
  });
});
