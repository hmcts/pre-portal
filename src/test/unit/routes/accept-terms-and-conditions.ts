import { mockGetLatestTermsAndConditions, mockAcceptTermsAndConditions } from '../../mock-api';
import { Terms } from '../../../main/types/terms';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { describe } from '@jest/globals';
import { mockeduser } from '../test-helper';
import { UserProfile } from '../../../main/types/user-profile';

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

/* eslint-disable jest/expect-expect */
describe('Accept Terms and Conditions page', () => {
  test('should return 200 when viewing page', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    mockGetLatestTermsAndConditions({
      id: '1234',
      type: 'portal',
      html: 'foobar test',
      created_at: '2024-10-02T16:30:00.000Z',
    } as Terms);

    const acceptTermsAndConditions = require('../../../main/routes/accept-terms-and-conditions').default;
    acceptTermsAndConditions(app);

    const response = await request(app).get('/accept-terms-and-conditions');
    expect(response.status).toBe(200);
    expect(response.text).toContain('foobar test');
  });

  test('should return 200 when posting to accept terms', async () => {
    const app = require('express')();
    app.use(require('body-parser').urlencoded({ extended: true }));
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    mockAcceptTermsAndConditions();

    const acceptTermsAndConditions = require('../../../main/routes/accept-terms-and-conditions').default;
    acceptTermsAndConditions(app);

    const payload = new URLSearchParams();
    payload.append('terms', 'accept');
    payload.append('termsId', '1234');

    const response = await request(app)
      .post('/accept-terms-and-conditions')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(payload.toString());

    expect(response.status).toBe(302);
    expect(response.text).toContain('Found. Redirecting to /browse');
  });
});
