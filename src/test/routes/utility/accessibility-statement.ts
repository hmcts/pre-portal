import { app } from '../../../main/app';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Accessibility Statement page', () => {
  describe('on GET', () => {
    test('should return 200', async () => {
      await request(app)
        .get('/accessibility-statement')
        .expect(res => {
          expect(res.status).toBe(200);
          expect(res.text).toContain('Accessibility statement');
        });
    });
  });
});
