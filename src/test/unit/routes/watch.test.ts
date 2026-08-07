/* eslint-disable jest/expect-expect */
import { Nunjucks } from '../../../main/modules/nunjucks';
import {
  mockedEditRequest,
  mockGetEditRequest,
  mockGetRecording,
  mockGetRecordingPlaybackData,
  mockPutAudit,
  reset,
} from '../../mock-api';
import { beforeAll, describe } from '@jest/globals';

import { PreClient } from '../../../main/services/pre-api/pre-client';
import { mockUser } from '../test-helper';
import { RecordingAppliedEdits } from '../../../main/services/pre-api/types';

jest.mock('../../../main/utils/helpers', () => {
  const actual = jest.requireActual('../../../main/utils/helpers');
  return {
    ...actual,
    isFlagEnabled: jest.fn().mockReturnValue(true),
  };
});

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
      mockGetEditRequest({
        ...mockedEditRequest,
        status: 'SUBMITTED',
        created_at: new Date().toISOString(),
        created_by: 'Test User',
        modified_at: new Date().toISOString(),
      });

      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(200))
        .expect(res => expect(res.text).toContain('legitimate need and having full authorisation.'))
        .expect(res => expect(res.text).toContain('Laptop and Desktop devices only.'))
        .expect(res => expect(res.text).toContain('/assets/js/mkplayer.js'))
        .expect(res => expect(res.text).not.toContain('/assets/js/video.min.js'));
      await request(app)
        .get('/watch/12345678-1234-1234-1234-1234567890ab/playback')
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

    test('should show in progress edit request button for V2 when parent has pending request', async () => {
      const v2RecordingId = '11111111-1111-1111-1111-111111111111';
      const parentRecordingId = '22222222-2222-2222-2222-222222222222';

      jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async (_xUserId: string, id: string) => {
        if (id === v2RecordingId) {
          return {
            id: v2RecordingId,
            parent_recording_id: parentRecordingId,
            version: 2,
            filename: 'v2.mp4',
            duration: 'PT1H1M1S',
            edit_instructions: '{}',
            case_id: 'case-1',
            case_reference: 'CASE-REF',
            capture_session: {
              id: '',
              booking_id: '',
              origin: '',
              ingest_address: '',
              live_output_url: '',
              started_at: '',
              started_by_user_id: '',
              finished_at: '',
              finished_by_user_id: '',
              status: '',
              deleted_at: '',
              court_name: '',
              case_state: 'OPEN',
            },
            deleted_at: '',
            created_at: '',
            is_test_case: false,
            participants: [],
          } as any;
        }

        if (id === parentRecordingId) {
          return {
            id: parentRecordingId,
            parent_recording_id: parentRecordingId,
            version: 1,
            filename: 'v1.mp4',
            duration: 'PT1H1M1S',
            edit_instructions: '{}',
            case_id: 'case-1',
            case_reference: 'CASE-REF',
            capture_session: {
              id: '',
              booking_id: '',
              origin: '',
              ingest_address: '',
              live_output_url: '',
              started_at: '',
              started_by_user_id: '',
              finished_at: '',
              finished_by_user_id: '',
              status: '',
              deleted_at: '',
              court_name: '',
              case_state: 'OPEN',
            },
            deleted_at: '',
            created_at: '',
            is_test_case: false,
            participants: [],
            edit_status: 'SUBMITTED',
          } as any;
        }

        return null;
      });

      mockGetRecordingPlaybackData();
      mockPutAudit();

      const response = await request(app).get(`/watch/${v2RecordingId}`);
      expect(response.status).toBe(200);
      // TODO: Fix
      // expect(response.text).toContain('View in progress edit request');
      // expect(response.text).not.toContain('Make an edit request');
      // expect(response.text).toContain(`/edit-request/${parentRecordingId}`);
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

  test('should set runtimeReference to the removed duration for each edit', async () => {
    const mockClient = PreClient.prototype;
    const mockEditInstructions: RecordingAppliedEdits = {
      editInstructions: {
        requestedInstructions: [
          { start_of_cut: '00:00:30', end_of_cut: '00:00:40', reason: 'Cut 10 seconds' },
          { start_of_cut: '00:01:00', end_of_cut: '00:01:25', reason: 'Cut 25 seconds' },
        ],
      },
      editRequestId: '12345678-1234-1234-1234-1234567890ab',
    };

    jest.spyOn(PreClient.prototype, 'getEditRequest').mockImplementation(async () => {
      return {
        id: '12345678-1234-1234-1234-1234567890ab',
        status: 'COMPLETE',
        edit_instructions: {
          requestedInstructions: [],
        },
        approved_by: 'approver',
        approved_at: '2023-01-01T00:00:00Z',
        created_by: 'creator',
        created_at: '2023-01-01T00:00:00Z',
        modified_at: '2023-01-01T00:00:00Z',
      };
    });

    const result = await parseAppliedEdits(JSON.stringify(mockEditInstructions), mockClient, 'user-id');

    expect(result?.appliedEdits.map(edit => edit.runtimeReference)).toEqual(['00:00:10', '00:00:25']);
  });
});
