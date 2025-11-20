import { app } from '../../../main/app';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('MK live events page success', () => {
  describe('on GET', () => {
    test('should return 302', async () => {
      await request(app)
        .get('/admin/MK-live-events')
        .expect(res => {
          console.log(JSON.stringify(res.headers));
          console.log('Location: ' + res.header.location);
          console.log('Http status: ' + res.status);
          expect(res.status).toBe(302);
          expect(res.header.location).toContain('.b2clogin.com');
        });
    });
  });
});
