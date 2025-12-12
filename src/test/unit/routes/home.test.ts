import { describe, expect, test } from 'vitest';
import express from 'express';
import request from 'supertest';
import home from '../../../main/routes/home';

/* eslint-disable vitest/expect-expect */
describe('Home route', () => {
  test('home redirects to /browse', async () => {
    const app = express();
    home(app);
    const response = await request(app).get('/');
    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual('/browse');
  });
});
