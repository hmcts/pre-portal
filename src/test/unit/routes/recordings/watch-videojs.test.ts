/* eslint-disable vitest/expect-expect */
import { describe, expect, test, vi, beforeAll } from 'vitest';
import { mockeduser } from '../../test-helper';

vi.mock('express-openid-connect', () => ({
  __esModule: true,
  default: {
    requiresAuth: () => (req: any, _res: any, next: any) => {
      req.oidc = {
        isAuthenticated: () => true,
        user: { email: 'test@test.com' },
      };
      next();
    },
  },
}));
vi.mock('../../main/services/session-user/session-user', () => {
  return {
    SessionUser: {
      getLoggedInUserPortalId: vi.fn().mockImplementation((req: Express.Request) => {
        return '123';
      }),
      getLoggedInUserBrowseId: vi.fn().mockImplementation((req: Express.Request) => {
        return 'super-user-access-id';
      }),
      getLoggedInUserProfile: vi.fn().mockImplementation((req: Express.Request) => {
        return mockeduser;
      }),
      getSuperUserId: vi.fn().mockImplementation((req: Express.Request) => {
        return mockeduser.app_access?.find(access => access.active && access.role.name === UserLevel.SUPER_USER)?.id;
      }),
      isLoggedInSuperUser: vi.fn().mockImplementation(() => {
        return mockeduser.app_access?.find(access => access.active && access.role.name === UserLevel.SUPER_USER);
      }),
    },
  };
});

import { Nunjucks } from '../../../../main/modules/nunjucks';
import { mockGetRecording, mockGetRecordingPlaybackData, mockPutAudit, reset } from '../../../mock-api';

import { PreClient } from '../../../../main/services/pre-api/pre-client';

import express from 'express';
import watch from '../../../../main/routes/recordings/watch';
import request from 'supertest';
import { UserLevel } from '../../../../main/types/user-level';

describe('Watch videojs page failure', () => {
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
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ff?flavour=videojs')
        .expect(res => expect(res.status).toBe(404));
    });
    test('should return 404 when getRecordingPlaybackDataMk returns null', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ff/playback?flavour=videojs')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecording id is invalid', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/recordings/watch/something?flavour=videojs')
        .expect(res => expect(res.status).toBe(404));
    });
    test('should return 404 when getRecordingPlaybackDataMk id is invalid', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/recordings/watch/something/playback?flavour=videojs')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when getRecording fails', async () => {
      vi.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (xUserId: string, id: string) => {
        throw new Error('Error');
      });
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab?flavour=videojs')
        .expect(res => expect(res.status).toBe(500));
    });
    test('should return 500 when getRecordingPlaybackDataMk fails', async () => {
      vi.spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk').mockImplementation(
        async (xUserId: string, id: string) => {
          throw new Error('Error');
        }
      );
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab/playback?flavour=videojs')
        .expect(res => expect(res.status).toBe(500));
    });
  });
});

describe('Watch videojs page success', () => {
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
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab?flavour=videojs')
        .expect(res => expect(res.status).toBe(200))
        .expect(res => expect(res.text).toContain('legitimate need and having full authorisation.'))
        .expect(res => expect(res.text).toContain('Laptop and Desktop devices only.'))
        .expect(res => expect(res.text).toContain('/assets/js/video.min.js'))
        .expect(res => expect(res.text).toContain('/assets/js/hls.min.js'))
        .expect(res => expect(res.text).toContain('xhrSetup'))
        .expect(res => expect(res.text).toContain('/drm/clear-key'))
        .expect(res => expect(res.text).not.toContain('/assets/js/mkplayer.js'));
      await request(app)
        .get('/recordings/watch/12345678-1234-1234-1234-1234567890ab/playback?flavour=videojs')
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
