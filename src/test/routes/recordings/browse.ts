import { app } from '../../../main/app';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Browse page success', () => {
  describe('on GET', () => {
    test('should return 302', async () => {
      await request(app)
        .get('/browse')
        .expect(res => {
          expect(res.status).toBe(302);
          expect(res.header.location).toContain('.b2clogin.com');
        });
    });
  });
});
