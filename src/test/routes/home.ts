import { app } from '../../main/app';

import { expect } from 'chai';
import request from 'supertest';

/* eslint-disable jest/expect-expect */
describe('Home page', () => {
  describe('on GET', () => {
    test('should redirect', async () => {
      await request(app)
        .get('/')
        .expect(res => expect(res.status).to.equal(302));
    });
  });
});
