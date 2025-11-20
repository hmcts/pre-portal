import { app } from '../../../main/app';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('MK live events page success', () => {
  describe('on GET', () => {
    test('should return 302', async () => {
      await request(app)
        .get('/admin/MK-live-events')
        .expect(res => {
          expect(res.status).toBe(302);
          expect(res.header.location).toContain('.b2clogin.com');
        });
    });
  });
});
