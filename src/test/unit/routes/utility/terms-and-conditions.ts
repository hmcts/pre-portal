import { mockGetLatestTermsAndConditions } from '../../../mock-api';
import { Terms } from '../../../../main/types/terms';
import { Nunjucks } from '../../../../main/modules/nunjucks';
import termsAndConditions from '../../../../main/routes/utility/terms-and-conditions';
import express from 'express';
import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Terms and Conditions page', () => {
  test('should return 200', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);

    mockGetLatestTermsAndConditions({
      id: '1234',
      type: 'portal',
      html: 'foobar test',
      created_at: '2024-10-02T16:30:00.000Z',
    } as Terms);

    termsAndConditions(app);

    const response = await request(app).get('/terms-and-conditions');
    expect(response.status).toBe(200);
    expect(response.text).toContain('foobar test');
  });
});
