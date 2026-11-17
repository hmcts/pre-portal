import { app } from '../../main/app';
import { describe, expect, test } from '@jest/globals';

import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Home page', () => {
  describe('on GET', () => {
    test('should redirect', async () => {
      await request(app)
        .get('/')
        .expect(res => {
          expect(res.status).toBe(302);
          expect(res.header.location).toContain('browse');
        });
    });
  });
});
