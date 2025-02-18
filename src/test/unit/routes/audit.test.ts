/* eslint-disable jest/expect-expect */
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockGetAuditLogs, mockAuditLogs, reset } from '../../mock-api';
import { beforeAll, describe } from '@jest/globals';

import { PreClient } from '../../../main/services/pre-api/pre-client';
import { UserProfile } from '../../../main/types/user-profile';
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
      getLoggedInUserPortalId: jest.fn().mockImplementation((req: Express.Request) => {
        return '123';
      }),
      getLoggedInUserProfile: jest.fn().mockImplementation((req: Express.Request) => {
        return mockeduser as UserProfile;
      }),
    },
  };
});
describe('Audit route', () => {
  beforeAll(() => {
    reset();
  });

  test('audit renders the audit template', async () => {
    jest.setTimeout(65000); // seems to be a slow page in tests for some reason

    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    mockGetAuditLogs([]);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Audit Logs');
    expect(response.text).toContain('<a href="/logout" class="govuk-back-link">Sign out</a>');
  });

  test('should display "Page is not available" for non-super user', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const audit = require('../../../main/routes/audit').default;
    audit(app);

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/audit');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });

  test('should display "Page is not available" for super user', async () => {
    jest.spyOn(PreClient.prototype, 'getAuditLogs').mockImplementation(() => {
      throw new Error('error');
    });

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit');
    expect(response.status).toEqual(404);
  });

  test('pagination should have a previous link', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(12).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 1);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=1');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<span class="govuk-pagination__link-title"> Previous');
  });

  test('pagination should have a next link', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(12).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 0);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=0');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<span class="govuk-pagination__link-title"> Next');
  });

  test('pagination should have a filler ellipsis when more than 2 pages from the start', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(50).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 4);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=4');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('pagination should have a filler ellipsis when more than 2 pages from the end', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(50).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 0);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=0');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('pagination should show 2 pages either side of the current page', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(90).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 4);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=4');
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(response.status).toEqual(200);
    expect(text).toContain('> 1 <');
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
    expect(text).toContain('> 3 <');
    expect(text).toContain('> 4 <');
    expect(text).toContain('> 5 <');
    expect(text).toContain('> 6 <');
    expect(text).toContain('> 7 <');
    expect(text).toContain('> 9 <');
  });

  test('pagination should show all the page numbers', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(40).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 1);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=1');
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(response.status).toEqual(200);
    expect(text).toContain('> 1 <');
    expect(text).toContain('> 2 <');
    expect(text).toContain('> 3 <');
    expect(text).toContain('> 4 <');
    expect(text).not.toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('heading should contain current page, max page and number of auditLogs', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const auditLogs = Array(100).fill(mockAuditLogs[0]).flat();

    mockGetAuditLogs(auditLogs, 4);

    const audit = require('../../../main/routes/audit').default;
    audit(app);

    const response = await request(app).get('/audit?page=4');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Audit Logs 41 to 50 of 100');
  });
});
