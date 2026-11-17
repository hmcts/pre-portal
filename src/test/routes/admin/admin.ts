import { app } from '../../../main/app';

import request from 'supertest';
import { describe, expect, test } from '@jest/globals';

/* eslint-disable jest/expect-expect */
describe('Admin page success', () => {
  describe('on GET', () => {
    test('should return 302', async () => {
      await request(app)
        .get('/admin')
        .expect(res => {
          expect(res.status).toBe(302);
          expect(res.header.location).toContain('.b2clogin.com');
        });
    });
  });
});
