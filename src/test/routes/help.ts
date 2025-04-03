import { app } from '../../main/app';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Help page', () => {
  describe('on GET', () => {
    test('should return 200', async () => {
      await request(app)
        .get('/help')
        .expect(res => {
          expect(res.status).toBe(200);
          expect(res.text).toContain('Help');
        });
    });
  });
});
