import express from 'express';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { Nunjucks } from '../../../main/modules/nunjucks';

const registerRoute = async (app: express.Express) => {
  const { default: help } = await import('../../../main/routes/help');
  help(app);
};

/* eslint-disable vitest/expect-expect */
describe('Help page', () => {
  test('should return 200', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    await registerRoute(app);

    const response = await request(app).get('/help');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Help');
    expect(response.text).toContain(
      'Please follow instructions in the user guide provided ' + 'in the Portal invitation email.'
    );
    expect(response.text).toContain(
      'If you require further assistance, please contact support on ' +
        '0300 323 0194 between the hours of 08:00 and 18:00 weekdays, or 08:30 and 14:00 Saturday.'
    );
  });
});
