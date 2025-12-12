import { Nunjucks } from '../../../main/modules/nunjucks';

/* eslint-disable jest/expect-expect */
describe('Help page', () => {
  test('should return 200', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const help = require('../../../main/routes/help').default;
    help(app);

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
