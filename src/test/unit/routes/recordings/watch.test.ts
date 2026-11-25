/* eslint-disable vitest/expect-expect */
import { describe, expect, test, vi, beforeAll } from 'vitest';

import { Nunjucks } from '../../../../main/modules/nunjucks';
import { mockGetRecording, mockGetRecordingPlaybackData, mockPutAudit, reset } from '../../../mock-api';

import { PreClient } from '../../../../main/services/pre-api/pre-client';
import { mockeduser } from '../../test-helper';
import express from 'express';
import request from 'supertest';
import watch from '../../../../main/routes/recordings/watch';

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
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ff')
        .expect(res => expect(res.status).toBe(404));
    });
    test('should return 404 when getRecordingPlaybackDataMk returns null', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ff/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecording id is invalid', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/recordings/watch/something')
        .expect(res => expect(res.status).toBe(404));
    });
    test('should return 404 when getRecordingPlaybackDataMk id is invalid', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/recordings/watch/something/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when getRecording fails', async () => {
      vi.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (_xUserId: string, _id: string) => {
        throw new Error('Error');
      });
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });
    test('should return 500 when getRecordingPlaybackDataMk fails', async () => {
      vi.spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk').mockImplementation(
        async (_xUserId: string, _id: string) => {
          throw new Error('Error');
        }
      );
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab/playback')
        .expect(res => expect(res.status).toBe(500));
    });
    test('should return a generic 500 response when playback fails with a non-Error value', async () => {
      vi.spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk').mockRejectedValue('failure');

      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab/playback')
        .expect(500)
        .expect({ message: 'Internal server error' });
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
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(200))
        .expect(res => expect(res.text).toContain('legitimate need and having full authorisation.'))
        .expect(res => expect(res.text).toContain('Laptop and Desktop devices only.'))
        .expect(res => expect(res.text).toContain('/assets/js/mkplayer.js'))
        .expect(res => expect(res.text).not.toContain('/assets/js/video.min.js'));
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab/playback')
        .expect(res => expect(res.status).toBe(200));
      expect(PreClient.prototype.getRecording).toHaveBeenCalledWith(
        'super-user-access-id',
        '12345678-1234-1234-1234-1234567890ab'
      );
      expect(PreClient.prototype.putAudit).toHaveBeenCalledWith('super-user-access-id', expect.any(Object));
      expect(PreClient.prototype.getRecordingPlaybackDataMk).toHaveBeenCalledWith(
        'super-user-access-id',
        '12345678-1234-1234-1234-1234567890ab'
      );
    });
  });
});
