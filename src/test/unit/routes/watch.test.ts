/* eslint-disable jest/expect-expect */
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockGetRecording, mockGetRecordingPlaybackData, mockPutAudit, reset } from '../../mock-api';
import { beforeAll, describe } from '@jest/globals';

import { PreClient } from '../../../main/services/pre-api/pre-client';
import { mockUser } from '../test-helper';
import { RecordingAppliedEdits } from '../../../main/services/pre-api/types';

mockUser();

describe('Watch page failure', () => {
  beforeAll(() => {
    reset();
  });

  describe('on GET', () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const watch = require('../../../main/routes/watch').default;
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
      jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (xUserId: string, id: string) => {
        throw new Error('Error');
      });
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });
    test('should return 500 when getRecordingPlaybackDataMk fails', async () => {
      jest
        .spyOn(PreClient.prototype, 'getRecordingPlaybackDataMk')
        .mockImplementation(async (xUserId: string, id: string) => {
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
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const watch = require('../../../main/routes/watch').default;
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

describe('parseAppliedEdits', () => {
  beforeAll(() => {
    reset();
  });

  const parseAppliedEdits = require('../../../main/routes/watch').parseAppliedEdits;

  test('should return undefined if edits is empty', async () => {
    const mockClient = PreClient.prototype;
    const result = await parseAppliedEdits('', mockClient, 'user-id');
    expect(result).toBeUndefined();
  });

  test('should return undefined if editInstructions or editRequestId is missing', async () => {
    const mockClient = PreClient.prototype;
    const result = await parseAppliedEdits('{"editInstructions": null, "editRequestId": null}', mockClient, 'user-id');
    expect(result).toBeUndefined();
  });

  test('should parse and return applied edits correctly', async () => {
    const mockClient = PreClient.prototype;
    const mockEditInstructions: RecordingAppliedEdits = {
      editInstructions: {
        requestedInstructions: [{ start_of_cut: '00:00:10', end_of_cut: '00:00:20', reason: 'Test reason' }],
      },
      editRequestId: '12345678-1234-1234-1234-1234567890ab',
    };

    jest.spyOn(PreClient.prototype, 'getEditRequest').mockImplementation(async (xUserId: string, id: string) => {
      return {
        id: '12345678-1234-1234-1234-1234567890ab',
        status: 'COMPLETE',
        edit_instructions: {
          requestedInstructions: [{ start_of_cut: '00:00:10', end_of_cut: '00:00:20', reason: 'Test reason' }],
        },
        approved_by: 'approver',
        approved_at: '2023-01-01T00:00:00Z',
        created_by: 'creator',
        created_at: '2023-01-01T00:00:00Z',
        modified_at: '2023-01-01T00:00:00Z',
      };
    });

    const result = await parseAppliedEdits(JSON.stringify(mockEditInstructions), mockClient, 'user-id');

    expect(result).toEqual({
      appliedEdits: [
        {
          startOfCut: '00:00:10',
          start: 10,
          endOfCut: '00:00:20',
          end: 20,
          reason: 'Test reason',
          runtimeReference: '00:00:10',
        },
      ],
      approvedBy: 'approver',
      approvedAt: '1/1/2023',
    });
  });
});
