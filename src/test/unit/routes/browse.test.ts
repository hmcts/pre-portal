/* eslint-disable jest/expect-expect */
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockGetRecordings, reset, mockRecordings } from '../../mock-api';
import { beforeAll, describe } from '@jest/globals';

import { PreClient } from '../../../main/services/pre-api/pre-client';
import { UserProfile } from '../../../main/types/user-profile';
import { mockeduser } from '../test-helper';
import { convertIsoToDate } from '../../../main/routes/browse';

jest.mock('express-openid-connect', () => {
  return {
    requiresAuth: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        next();
      };
    }),
  };
});
jest.mock('../../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: jest.fn().mockImplementation(() => {
        return '123';
      }),
      getLoggedInUserProfile: jest.fn().mockImplementation(() => {
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
    jest.setTimeout(65000); // seems to be a slow page in tests for some reason

    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    mockGetRecordings([]);

    const browse = require('../../../main/routes/browse').default;
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
    jest.spyOn(PreClient.prototype, 'getRecordings').mockImplementation(() => {
      throw new Error('error');
    });

    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(500);
  });

  test('pagination should have a previous link', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(12).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 1);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse?page=1');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<span class="govuk-pagination__link-title"> Previous');
  });

  test('pagination should have a next link', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(12).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 0);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse?page=0');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<span class="govuk-pagination__link-title"> Next');
  });

  test('pagination should have a filler ellipsis when more than 2 pages from the start', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(50).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 4);

    const browse = require('../../../main/routes/browse').default;
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

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse?page=0');
    expect(response.status).toEqual(200);
    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('<li class="govuk-pagination__item govuk-pagination__item--ellipses"> &ctdot; </li>');
  });

  test('pagination should show 2 pages either side of the current page', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(90).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 4);

    const browse = require('../../../main/routes/browse').default;
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
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(40).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 1);

    const browse = require('../../../main/routes/browse').default;
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
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = Array(100).fill(mockRecordings[0]).flat();

    mockGetRecordings(recordings, 4);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse?page=4');
    expect(response.status).toEqual(200);
    expect(response.text).toContain('Recordings 41 to 50 of 100');
  });

  test('should render Original for version 1', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = [
      {
        ...mockRecordings[0],
        id: 'original-version',
        case_reference: 'CASE-ORIGINAL',
        version: 1,
      },
    ];

    mockGetRecordings(recordings);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(200);

    const text = response.text.replace(/\s+/g, ' ').trim();

    expect(text).toMatch(
      /id="recording-original-version"[\s\S]*?<td class="govuk-table__cell" style="position: sticky; left: 0; z-index: 1; background-color: #ffffff;"> CASE-ORIGINAL <\/td>[\s\S]*?<td class="govuk-table__cell"> Original <\/td>/
    );
  });

  test('should render the version number for complete later versions', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');
    const recordings = [
      {
        ...mockRecordings[1],
        id: 'updated-version',
        case_reference: 'CASE-V2',
        version: 2,
        edit_status: 'COMPLETE',
      },
    ];

    mockGetRecordings(recordings);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(200);

    const text = response.text.replace(/\s+/g, ' ').trim();

    expect(text).toMatch(
      /id="recording-updated-version"[\s\S]*?<td class="govuk-table__cell" style="position: sticky; left: 0; z-index: 1; background-color: #ffffff;"> CASE-V2 <\/td>[\s\S]*?<td class="govuk-table__cell"> 2 <\/td>/
    );
  });

  test('should show Pending for non-complete V2+ versions', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const recordings = [
      {
        ...mockRecordings[0],
        id: '22222222-2222-2222-2222-222222222222',
        parent_recording_id: 'parentId',
        case_reference: 'CASE-V2',
        version: 2,
        edit_status: 'APPROVED',
      },
    ];

    mockGetRecordings(recordings);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(200);

    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('CASE-V2');
    expect(text).toContain('<td class="govuk-table__cell"> Pending </td>');
  });

  test('should show a draft version row when recording has a DRAFT edit request', async () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const recordings = [
      {
        ...mockRecordings[0],
        id: 'source-v1',
        case_reference: 'CASE-DRAFT',
        version: 1,
        total_version_count: 1,
        edit_requests: [{ id: 'draft-request-1', status: 'DRAFT' }],
      },
    ];

    mockGetRecordings(recordings);

    const browse = require('../../../main/routes/browse').default;
    browse(app);

    const response = await request(app).get('/browse');
    expect(response.status).toEqual(200);

    const text = response.text.replace(/\s+/g, ' ').trim();
    expect(text).toContain('recording-source-v1-draft-request-1');
    expect(text).toContain('<td class="govuk-table__cell"> Draft </td>');
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
