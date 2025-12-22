import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import { mockGetLatestTermsAndConditions, mockAcceptTermsAndConditions } from '../../mock-api';
import { Terms } from '../../../main/types/terms';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockeduser } from '../test-helper';
import { UserProfile } from '../../../main/types/user-profile';

vi.mock('express-openid-connect', () => ({
  requiresAuth: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    next();
  }),
}));

vi.mock('../../../main/services/session-user/session-user', () => ({
  SessionUser: {
    getLoggedInUserPortalId: vi.fn().mockReturnValue('123'),
    getLoggedInUserProfile: vi.fn().mockReturnValue(mockeduser as UserProfile),
  },
}));

const registerRoute = async (app: express.Express) => {
  const { default: acceptTermsAndConditions } = await import('../../../main/routes/accept-terms-and-conditions');
  acceptTermsAndConditions(app);
};

/* eslint-disable vitest/expect-expect */
describe('Accept Terms and Conditions page', () => {
  test('should return 200 when viewing page', async () => {
    mockGetLatestTermsAndConditions({
      id: '1234',
      type: 'portal',
      html: 'foobar test',
      created_at: '2024-10-02T16:30:00.000Z',
    } as Terms);

    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    const response = await request(app).get('/accept-terms-and-conditions');
    expect(response.status).toBe(200);
    expect(response.text).toContain('foobar test');
  });

  test('should return 200 when posting to accept terms', async () => {
    mockAcceptTermsAndConditions();

    const app = express();
    app.use(express.urlencoded({ extended: true }));
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

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
