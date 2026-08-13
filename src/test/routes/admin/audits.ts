import { app } from '../../../main/app';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Audits page success', () => {
  describe('on GET', () => {
    test('should return 302', async () => {
      await request(app)
        .get('/admin/audit')
        .expect(res => {
          expect(res.status).toBe(302);
          expect(res.header.location).toContain('.b2clogin.com');
        });
    });
  });
});
