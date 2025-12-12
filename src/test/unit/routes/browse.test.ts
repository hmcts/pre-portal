/* eslint-disable vitest/expect-expect */
import { describe, expect, test, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockGetRecordings, reset, mockRecordings } from '../../mock-api';
import browse, { convertIsoToDate } from '../../../main/routes/browse';

import { PreClient } from '../../../main/services/pre-api/pre-client';
import { UserProfile } from '../../../main/types/user-profile';
import { mockeduser } from '../test-helper';

vi.mock('express-openid-connect', () => {
  return {
    requiresAuth: vi.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        next();
      };
    }),
  };
});
vi.mock('../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: vi.fn().mockImplementation((_req: Express.Request) => {
        return '123';
      }),
      getLoggedInUserProfile: vi.fn().mockImplementation((_req: Express.Request) => {
        return mockeduser as UserProfile;
      }),
    },
  };
});
describe('Browse route', () => {
  beforeAll(() => {
    reset();
  });

  test('browse renders the browse template', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    mockGetRecordings([]);

    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Recordings');
    expect(response.text).toContain('Welcome back,');
    expect(response.text).toContain('legitimate need and having full authorisation.');
    expect(response.text).toContain('Laptop and Desktop devices only.');
    expect(response.text).toContain('<a href="/logout" class="govuk-back-link">Sign out</a>');
  });

  test('should return 500', async () => {
    vi.spyOn(PreClient.prototype, 'getRecordings').mockImplementation(() => {
      throw new Error('error');
    });

    const app = express();
    new Nunjucks(false).enableFor(app);

    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(500);
  });

  test('pagination should have a previous link', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    const recordings = Array(12).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 1);

    browse(app);

    const response = await request(app).get('/browse?page=1');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<span class="govuk-pagination__link-title"> Previous');
  });

  test('pagination should have a next link', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    const recordings = Array(12).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 0);

    browse(app);

    const response = await request(app).get('/browse?page=0');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<span class="govuk-pagination__link-title"> Next');
  });

  test('pagination should have a filler ellipsis when more than 2 pages from the start', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    const recordings = Array(50).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 4);

    browse(app);

    const response = await request(app).get('/browse?page=4');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('pagination should have a filler ellipsis when more than 2 pages from the end', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(50).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 0);

    browse(app);

    const response = await request(app).get('/browse?page=0');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('pagination should show 2 pages either side of the current page', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    const recordings = Array(90).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 4);

    browse(app);

    const response = await request(app).get('/browse?page=4');
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(response.status).toEqual(200);
    expect(text).toContain('> 1 <');
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
    expect(text).toContain('> 3 <');
    expect(text).toContain('> 4 <');
    expect(text).toContain('> 5 <');
    expect(text).toContain('> 6 <');
    expect(text).toContain('> 7 <');
    expect(text).toContain('> 9 <');
  });

  test('pagination should show all the page numbers', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    const recordings = Array(40).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 1);

    browse(app);

    const response = await request(app).get('/browse?page=1');
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(response.status).toEqual(200);
    expect(text).toContain('> 1 <');
    expect(text).toContain('> 2 <');
    expect(text).toContain('> 3 <');
    expect(text).toContain('> 4 <');
    expect(text).not.toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('heading should contain current page, max page and number of recordings', async () => {
    const app = express();
    new Nunjucks(false).enableFor(app);
    const recordings = Array(100).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 4);

    browse(app);

    const response = await request(app).get('/browse?page=4');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Recordings 41 to 50 of 100');
  });
});

describe('convertIsoToDate', () => {
  test('should return the date in dd/mm/yyyy format for a valid ISO string', () => {
    const isoString = '2024-10-23T12:45:00Z';
    const result = convertIsoToDate(isoString);
    expect(result).toBe('23/10/2024');
  });

  test('should return undefined when the input is undefined', () => {
    const result = convertIsoToDate(undefined);
    expect(result).toBeUndefined();
  });

  test('should return undefined when the input is an empty string', () => {
    const result = convertIsoToDate('');
    expect(result).toBeUndefined();
  });

  test('should handle invalid date input gracefully', () => {
    const isoString = 'invalid-date';
    const result = convertIsoToDate(isoString);
    expect(result).toBe('Invalid Date');
  });
});
