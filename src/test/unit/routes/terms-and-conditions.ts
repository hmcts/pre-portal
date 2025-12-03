import express from 'express';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { mockGetLatestTermsAndConditions } from '../../mock-api';
import { Terms } from '../../../main/types/terms';
import { Nunjucks } from '../../../main/modules/nunjucks';

const registerRoute = async (app: express.Express) => {
  const { default: termsAndConditions } = await import('../../../main/routes/terms-and-conditions');
  termsAndConditions(app);
};

/* eslint-disable vitest/expect-expect */
describe('Terms and Conditions page', () => {
  test('should return 200', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    mockGetLatestTermsAndConditions({
      id: '1234',
      type: 'portal',
      html: 'foobar test',
      created_at: '2024-10-02T16:30:00.000Z',
    } as Terms);

    const response = await request(app).get('/terms-and-conditions');
    expect(response.status).toBe(200);
    expect(response.text).toContain('foobar test');
  });
});
