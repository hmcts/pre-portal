import { mockeduser } from '../test-helper';
import { UserProfile } from '../../../main/types/user-profile';
import { describe, test } from '@jest/globals';
import { mockGetAudit, reset } from '../../mock-api';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { UserLevel } from '../../../main/types/user-level';
import { PreClient } from '../../../main/services/pre-api/pre-client';

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

describe('/admin/audit/:id route', () => {
  const app = require('express')();
  new Nunjucks(false).enableFor(app);
  const request = require('supertest');
  const audit = require('../../../main/routes/admin/audit').default;
  audit(app);

  beforeAll(() => {
    reset();
  });

  test('audit renders the audit template', async () => {
    mockGetAudit();

    const response = await request(app).get('/admin/audit/12345678-1234-1234-1234-1234567890ab');
    expect(response.status).toEqual(200);

    expect(response.text).toContain('Audit: 12345678-1234-1234-1234-1234567890ab');
    expect(response.text).toContain('<a href="/logout" class="govuk-back-link">Sign out</a>');

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*Id[\s\n]*<\/dt>/);
    expect(response.text).toMatch(
      /<dd\s+class=["']govuk-summary-list__value["']\s*>[\s\n]*12345678-1234-1234-1234-1234567890ab[\s\n]*<\/dd>/
    );

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*Source[\s\n]*<\/dt>/);
    expect(response.text).toMatch(/<dd\s+class=["']govuk-summary-list__value["']\s*>[\s\n]*PORTAL[\s\n]*<\/dd>/);

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*Category[\s\n]*<\/dt>/);
    expect(response.text).toMatch(/<dd\s+class=["']govuk-summary-list__value["']\s*>[\s\n]*Recording[\s\n]*<\/dd>/);

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*Activity[\s\n]*<\/dt>/);
    expect(response.text).toMatch(/<dd\s+class=["']govuk-summary-list__value["']\s*>[\s\n]*Play[\s\n]*<\/dd>/);

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*Created At[\s\n]*<\/dt>/);
    expect(response.text).toMatch(
      /<dd\s+class=["']govuk-summary-list__value["']\s*>[\s\n]*2021-09-01T12:00:00Z[\s\n]*<\/dd>/
    );

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*Created By[\s\n]*<\/dt>/);
    expect(response.text).toContain('Example Example (example@example.com)');

    expect(response.text).toMatch(/<dt\s+class=["']govuk-summary-list__key["']\s*>[\s\n]*recordingId[\s\n]*<\/dt>/);
    expect(response.text).toMatch(
      /<dd\s+class=["']govuk-summary-list__value["']\s*>[\s\n]*12245678-1234-1234-1234-1234567890ab[\s\n]*<\/dd>/
    );
  });

  test('should display "Page is not available" when id is invalid', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/admin/audit/invalid-id');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });

  test('should display "Page is not available" for non-super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/audit/12345678-1234-1234-1234-1234567890ab');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });

  test('should display "Page is not available" for super user', async () => {
    jest.spyOn(PreClient.prototype, 'getAudit').mockImplementation(() => {
      throw new Error('error');
    });

    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    const response = await request(app).get('/admin/audit/12345678-1234-1234-1234-1234567890ab');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
