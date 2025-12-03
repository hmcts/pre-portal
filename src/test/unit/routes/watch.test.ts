/* eslint-disable vitest/expect-expect */
import { describe, expect, test, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockGetRecording, mockGetRecordingPlaybackData, mockPutAudit, reset } from '../../mock-api';
import watch from '../../../main/routes/watch';

import { PreClient } from '../../../main/services/pre-api/pre-client';
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
        return mockeduser;
      }),
    },
  };
});

describe('Watch page failure', () => {
  beforeAll(() => {
    reset();
  });

  describe('on GET', () => {
    const app = express();
    new Nunjucks(false).enableFor(app);

    watch(app);

    test('should return 404 when getRecording returns null', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ff')
        .expect(res => expect(res.status).toBe(404));
    });
    test('should return 404 when getRecordingPlaybackDataMk returns null', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ff/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecording id is invalid', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/watch/something')
        .expect(res => expect(res.status).toBe(404));
    });
    test('should return 404 when getRecordingPlaybackDataMk id is invalid', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/watch/something/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when getRecording fails', async () => {
      vi.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (_xUserId: string, _id: string) => {
        throw new Error('Error');
      });
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });
    test('should return 500 when getRecordingPlaybackDataMk fails', async () => {
      vi
        .spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk')
        .mockImplementation(async (_xUserId: string, _id: string) => {
          throw new Error('Error');
        });
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab/playback')
        .expect(res => expect(res.status).toBe(500));
    });
  });
});

describe('Watch page success', () => {
  beforeAll(() => {
    reset();
  });

  describe('on GET', () => {
    const app = express();
    new Nunjucks(false).enableFor(app);

    watch(app);

    test('should return 200 when getRecording and getRecordingPlaybackDataMk succeed', async () => {
      mockGetRecording();
      mockGetRecordingPlaybackData();
      mockPutAudit();
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(200))
        .expect(res => expect(res.text).toContain('legitimate need and having full authorisation.'))
        .expect(res => expect(res.text).toContain('Laptop and Desktop devices only.'));
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab/playback')
        .expect(res => expect(res.status).toBe(200));
    });
  });
});
