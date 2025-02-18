import { Nunjucks } from '../../../../main/modules/nunjucks';
import { beforeAll, describe, test, jest } from '@jest/globals';
import { mockeduser } from '../../test-helper';
import { UserLevel } from '../../../../main/types/user-level';
import { mockGetUser, mockUsers, reset } from '../../../mock-api';

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        next();
      };
    }),
  };
});

jest.mock('../../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation(() => '123'),
      getLoggedInUserProfile: jest.fn().mockImplementation(() => mockeduser),
    },
  };
});

describe('Admin View User Page Access', () => {
  let app;
  let request;

  beforeAll(() => {
    reset();
    app = require('express')();
    new Nunjucks(false).enableFor(app);
    request = require('supertest');
    const viewUserRoute = require('../../../../main/routes/admin/user').default;
    viewUserRoute(app);
  });

  test('should display view user page for super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetUser();

    const response = await request(app).get('/admin/users/someid');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('User: Example User');

    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('data-testid=\"user-summary\"');
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-first-name\"> Example </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-last-name\"> User </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-email\"> example@example.com </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-phone\"> 0123456789 </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-org\"> Example Organisation </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-app-access\"> Yes </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-portal-access\"> Yes </dd>'
    );

    expect(text).toContain('Application access details');
    expect(text).toContain('Portal access details');
  });

  test('should display view user page for super user when viewed user has no app access', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetUser({
      ...mockUsers[0],
      app_access: [],
    });

    const response = await request(app).get('/admin/users/someid');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('User: Example User');

    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('data-testid=\"user-summary\"');
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-first-name\"> Example </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-last-name\"> User </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-email\"> example@example.com </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-phone\"> 0123456789 </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-org\"> Example Organisation </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-app-access\"> No </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-portal-access\"> Yes </dd>'
    );

    expect(text).not.toContain('Application access details');
    expect(text).toContain('Portal access details');
  });

  test('should display view user page for super user when viewed user has no portal access', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.SUPER_USER;
    }

    mockGetUser({
      ...mockUsers[0],
      portal_access: [],
    });

    const response = await request(app).get('/admin/users/someid');

    expect(response.status).toEqual(200);
    expect(response.text).toContain('User: Example User');

    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('data-testid=\"user-summary\"');
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-first-name\"> Example </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-last-name\"> User </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-email\"> example@example.com </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-phone\"> 0123456789 </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-org\"> Example Organisation </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-app-access\"> Yes </dd>'
    );
    expect(text).toContain(
      '<dd class=\"govuk-summary-list__value\" data-testid=\"summary-value-portal-access\"> No </dd>'
    );

    expect(text).toContain('Application access details');
    expect(text).not.toContain('Portal access details');
  });

  test('should display "Page is not available" for non-super user', async () => {
    if (mockeduser.app_access?.[0]?.role) {
      mockeduser.app_access[0].role.name = UserLevel.ADMIN;
    }

    const response = await request(app).get('/admin/users/someid');
    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page is not available');
  });
});
