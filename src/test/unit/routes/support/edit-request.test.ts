import { Nunjucks } from '../../../../main/modules/nunjucks';
import config from 'config';
import { mockUser } from '../../test-helper';
import { set } from 'lodash';
import {
  mockedEditRequest,
  mockGetCurrentEditRequest,
  mockGetRecording,
  mockGetRecordingPlaybackData,
  reset,
} from '../../../mock-api';
import { describe } from '@jest/globals';
import { PutEditRequest } from '../../../../main/services/pre-api/types';
import { PreClient } from '../../../../main/services/pre-api/pre-client';

mockUser();
set(config, 'pre.enableAutomatedEditing', 'true');
const { parseIsoDuration, validateRequest } = require('../../../../main/routes/edit-request');

describe('edit-request route', () => {
  beforeAll(() => {
    reset();
  });

  describe('parseIsoDuration', () => {
    it('should parse ISO 8601 duration with hours, minutes and seconds', () => {
      const duration = 'PT1H30M45S';
      const result = parseIsoDuration(duration);
      expect(result).toBe(3600 + 30 * 60 + 45); // 5445 seconds
    });

    it('should parse ISO 8601 duration with only hours', () => {
      const duration = 'PT2H';
      const result = parseIsoDuration(duration);
      expect(result).toBe(2 * 3600); // 7200 seconds
    });

    it('should parse ISO 8601 duration with only minutes', () => {
      const duration = 'PT45M';
      const result = parseIsoDuration(duration);
      expect(result).toBe(45 * 60); // 2700 seconds
    });

    it('should parse ISO 8601 duration with only seconds', () => {
      const duration = 'PT30S';
      const result = parseIsoDuration(duration);
      expect(result).toBe(30);
    });

    it('should parse ISO 8601 duration with decimal seconds', () => {
      const duration = 'PT1M30.5S';
      const result = parseIsoDuration(duration);
      // Note: parseIsoDuration uses Number.parseInt which truncates decimal seconds
      expect(result).toBe(60 + 30); // 90 seconds (decimal part is truncated)
    });

    it('should throw error for invalid ISO 8601 duration format', () => {
      const duration = 'INVALID';
      expect(() => parseIsoDuration(duration)).toThrow('Invalid ISO 8601 duration format');
    });

    it('should parse zero duration', () => {
      const duration = 'PT0S';
      const result = parseIsoDuration(duration);
      expect(result).toBe(0);
    });
  });

  describe('validateRequest', () => {
    it('should return undefined for valid request with edit instructions', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '00:00:10',
            end_of_cut: '00:00:20',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty edit instructions', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined edit instructions', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: undefined as any,
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeUndefined();
    });

    it('should return error for empty start_of_cut', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '',
            end_of_cut: '00:00:20',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['startTime']).toBe('Please enter a valid time reference');
    });

    it('should return error for invalid start_of_cut format', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '25:00:00',
            end_of_cut: '00:00:20',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['startTime']).toBe('The Start reference entered is not in the HH:MM:SS format');
    });

    it('should return error for empty end_of_cut', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '00:00:10',
            end_of_cut: '',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['endTime']).toBe('Please enter a valid time reference');
    });

    it('should return error when end_of_cut equals start_of_cut', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '00:00:10',
            end_of_cut: '00:00:10',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['endTime']).toBe('End reference cannot be equal or less than the Start reference');
    });

    it('should return error when end_of_cut is less than start_of_cut', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '00:00:30',
            end_of_cut: '00:00:10',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['endTime']).toBe('End reference cannot be equal or less than the Start reference');
    });

    it('should return error when end_of_cut exceeds duration', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '00:00:10',
            end_of_cut: '02:00:00',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['endTime']).toBe('References cannot be greater than the duration of the recording');
    });

    it('should return error for overlapping instructions', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '00:00:10',
            end_of_cut: '00:00:30',
            reason: 'first instruction',
          },
          {
            start_of_cut: '00:00:20',
            end_of_cut: '00:00:40',
            reason: 'overlapping instruction',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeDefined();
      expect(result && result['error']).toContain('Overlapping Instructions');
    });

    it('should return error when reason contains &', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [{ start_of_cut: '00:00:10', end_of_cut: '00:00:20', reason: 'noise & echo' }],
      };
      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toEqual({ error: 'Special characters not allowed: & < >' });
    });

    it('should return error when reason contains <', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [{ start_of_cut: '00:00:10', end_of_cut: '00:00:20', reason: '<script>' }],
      };
      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toEqual({ error: 'Special characters not allowed: & < >' });
    });

    it('should return error when reason contains >', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [{ start_of_cut: '00:00:10', end_of_cut: '00:00:20', reason: 'a > b' }],
      };
      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toEqual({ error: 'Special characters not allowed: & < >' });
    });

    it('should trim whitespace from time references', () => {
      const request: PutEditRequest = {
        id: '123',
        source_recording_id: '456',
        status: 'DRAFT',
        edit_instructions: [
          {
            start_of_cut: '  00:00:10  ',
            end_of_cut: '  00:00:20  ',
            reason: 'test reason',
          },
        ],
      };

      const result = validateRequest(request, 'PT1H0M0S');
      expect(result).toBeUndefined();
    });
  });

  describe('on GET', () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const editRequestRoute = require('../../../../main/routes/edit-request').default;
    editRequestRoute(app);

    test('should return 500 when getCurrentEditRequest fails', async () => {
      mockGetRecording();
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          throw new Error('Error');
        });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect((res: { status: any }) => expect(res.status).toBe(500));
    });

    test('should return 500 when calculateTimeRemoved fails', async () => {
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [
            {
              id: '123',
              status: 'DRAFT',
              source_recording_id: '12345678-1234-1234-1234-1234567890ab',
              edit_instruction: {
                requestedInstructions: [
                  {
                    start_of_cut: '00:00:00',
                    end_of_cut: '00:00:00',
                  },
                ],
              },
              rejection_reason: '',
            },
          ];
        });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect(res => expect(res.status).toBe(500));
    });

    test('should return 404 when recording is not found', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ff')
        .expect((res: { status: any }) => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecordingPlaybackData returns null', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ff/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecording id is invalid', async () => {
      mockGetRecording(null);
      await request(app)
        .get('/edit-request/something')
        .expect((res: { status: any }) => expect(res.status).toBe(404));
    });

    test('should return 404 when edit request is not found', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest(null);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect((res: { status: any }) => expect(res.status).toBe(404));
    });

    test('should return 404 when getRecordingPlaybackData id is invalid', async () => {
      mockGetRecordingPlaybackData(null);
      await request(app)
        .get('/edit-request/something/playback')
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when getRecording fails', async () => {
      jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async () => {
        throw new Error('Error');
      });
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect((res: { status: any }) => expect(res.status).toBe(500));
    });

    test('should redirect to /edit-request/:id/view when getRecording and getCurrentEditRequest succeed', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest([
        {
          ...mockedEditRequest,
          status: 'SUBMITTED',
          created_at: new Date().toISOString(),
          created_by: 'Test User',
          modified_at: new Date().toISOString(),
        },
      ]);
      await request(app)
        .get('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .expect((res: { status: any }) => expect(res.status).toBe(302))
        .expect((res: { header: { location: any } }) =>
          expect(res.header.location).toBe('/edit-request/12345678-1234-1234-1234-1234567890ab/view')
        );
    });

    test('should render edit-request page with DRAFT status and log audit', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest([
        {
          ...mockedEditRequest,
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          created_by: 'Test User',
          modified_at: new Date().toISOString(),
        },
      ]);

      const putAuditSpy = jest.spyOn(PreClient.prototype, 'putAudit').mockImplementation(async () => {
        return Promise.resolve();
      });

      const res = await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab').expect(200);

      expect(putAuditSpy).toHaveBeenCalled();
      expect(res.text).toContain('/watch/12345678-1234-1234-1234-1234567890ab/playback');
      expect(res.text).toContain('/edit-request/12345678-1234-1234-1234-1234567890ab');
    });
  });

  describe('on POST', () => {
    const app = require('express')();
    app.use(require('body-parser').json());
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const editRequestRoute = require('../../../../main/routes/edit-request').default;
    editRequestRoute(app);

    test('should return 404 when id is invalid', async () => {
      await request(app)
        .post('/edit-request/invalid-id')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 404 when recording is not found', async () => {
      mockGetRecording(null);
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(404));
    });

    test('should return 500 when putEditRequest fails', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        throw new Error('Error');
      });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(500));
    });

    test('should return 200 when putEditRequest succeeds', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        return [
          {
            status: 201,
          },
        ];
      });
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [
            {
              id: '123',
              status: 'DRAFT',
              source_recording_id: '12345678-1234-1234-1234-1234567890ab',
              edit_instruction: {
                requestedInstructions: [
                  {
                    start_of_cut: '00:00:00',
                    end_of_cut: '00:00:00',
                  },
                ],
              },
              rejection_reason: '',
            },
          ];
        });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(200));
    });

    test('should return 400 when validation fails', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        return;
      });
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [
            {
              id: '123',
              status: 'DRAFT',
              source_recording_id: '12345678-1234-1234-1234-1234567890ab',
              edit_instruction: {
                requestedInstructions: [
                  {
                    start_of_cut: '00:00:00',
                    end_of_cut: '00:00:00',
                  },
                ],
              },
              rejection_reason: '',
            },
          ];
        });
      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:00',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(400))
        .expect(res =>
          expect(res.body).toStrictEqual({
            errors: {
              endTime: 'End reference cannot be equal or less than the Start reference',
            },
          })
        );
    });

    test('should reset request fields when status is REJECTED', async () => {
      mockGetRecording();
      const putEditRequestSpy = jest
        .spyOn(PreClient.prototype, 'putEditRequest')
        .mockImplementation(async (xUserId: string, body: any) => {
          expect(body.status).toBe('DRAFT');
          expect(body.jointly_agreed).toBeUndefined();
          expect(body.approved_at).toBeUndefined();
          expect(body.approved_by).toBeUndefined();
          expect(body.rejection_reason).toBeUndefined();
          return { status: 201 };
        });
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [mockedEditRequest];
        });

      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'REJECTED',
            jointly_agreed: true,
            approved_at: new Date().toISOString(),
            approved_by: 'test@test.com',
            rejection_reason: 'Test reason',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(200);

      expect(putEditRequestSpy).toHaveBeenCalled();
    });

    test('should reset request fields when status is COMPLETE', async () => {
      mockGetRecording();
      const putEditRequestSpy = jest
        .spyOn(PreClient.prototype, 'putEditRequest')
        .mockImplementation(async (xUserId: string, body: any) => {
          expect(body.status).toBe('DRAFT');
          expect(body.jointly_agreed).toBeUndefined();
          expect(body.approved_at).toBeUndefined();
          expect(body.approved_by).toBeUndefined();
          expect(body.rejection_reason).toBeUndefined();
          return { status: 201 };
        });
      jest
        .spyOn(PreClient.prototype, 'getMostRecentEditRequests')
        .mockImplementation(async (xUserId: string, sourceRecordingId: string) => {
          return [mockedEditRequest];
        });

      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'COMPLETE',
            jointly_agreed: true,
            approved_at: new Date().toISOString(),
            approved_by: 'test@test.com',
            rejection_reason: 'Test reason',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(200);

      expect(putEditRequestSpy).toHaveBeenCalled();
    });

    test('should return 400 when putEditRequest returns 400 status', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async (xUserId: string, body: any) => {
        return {
          status: 400,
          data: {
            message: 'Custom error message from API',
          },
        };
      });

      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(400))
        .expect(res =>
          expect(res.body).toStrictEqual({
            errors: {
              error: 'Custom error message from API',
            },
          })
        );
    });

    test('should return normalized 400 when putEditRequest returns nested errors.error', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'putEditRequest').mockImplementation(async () => {
        return {
          status: 400,
          data: {
            errors: {
              error: 'contains potentially malicious content',
            },
          },
        };
      });

      await request(app)
        .post('/edit-request/12345678-1234-1234-1234-1234567890ab')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            id: '12345678-1234-1234-1234-1234567890ab',
            source_recording_id: '12345678-1234-1234-1234-1234567890ab',
            status: 'DRAFT',
            edit_instructions: [
              {
                start_of_cut: '00:00:00',
                end_of_cut: '00:00:01',
              },
            ],
          })
        )
        .expect(res => expect(res.status).toBe(400))
        .expect(res =>
          expect(res.body).toStrictEqual({
            errors: {
              error: 'contains potentially malicious content',
            },
          })
        );
    });
  });

  describe('parseIsoDuration validation', () => {
    const { parseIsoDuration } = require('../../../../main/routes/edit-request');

    test('should throw error for invalid ISO 8601 duration format', () => {
      expect(() => parseIsoDuration('INVALID_DURATION')).toThrow('Invalid ISO 8601 duration format');
    });

    test('should parse duration with hours, minutes, and seconds', () => {
      expect(parseIsoDuration('PT1H30M45S')).toBe(5445); // 1*3600 + 30*60 + 45 = 5445 seconds
    });

    test('should parse duration without seconds component', () => {
      expect(parseIsoDuration('PT1H30M')).toBe(5400); // 1*3600 + 30*60 = 5400 seconds
    });

    test('should parse duration with only seconds', () => {
      expect(parseIsoDuration('PT30S')).toBe(30); // 30 seconds
    });

    test('should parse duration with hours and seconds but no minutes', () => {
      expect(parseIsoDuration('PT1H30S')).toBe(3630); // 1*3600 + 30 = 3630 seconds
    });

    test('should parse duration with only hours', () => {
      expect(parseIsoDuration('PT2H')).toBe(7200); // 2*3600 = 7200 seconds
    });

    test('should parse duration with only minutes', () => {
      expect(parseIsoDuration('PT45M')).toBe(2700); // 45*60 = 2700 seconds
    });

    test('should handle zero values', () => {
      expect(parseIsoDuration('PT0H0M0S')).toBe(0);
    });
  });

  describe('validation for put', () => {
    const { validateRequest } = require('../../../../main/routes/edit-request');

    test('should return an error when start_of_cut is empty', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '',
        end_of_cut: '00:00:01',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ startTime: 'Please enter a valid time reference' });
    });

    test('should return an error when start_of_cut is not in HH:MM:SS format', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:0t',
        end_of_cut: '00:00:01',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ startTime: 'The Start reference entered is not in the HH:MM:SS format' });
    });

    test('should return an error when end_of_cut is empty', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:00',
        end_of_cut: '',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'Please enter a valid time reference' });
    });

    test('should return an error when end_of_cut is not in HH:MM:SS format', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:00',
        end_of_cut: '00:00:0t',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'The End reference entered is not in the HH:MM:SS format' });
    });

    test('should return an error when end_of_cut is less than start_of_cut', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:01',
        end_of_cut: '00:00:00',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'End reference cannot be equal or less than the Start reference' });
    });

    test('should return an error when end_of_cut is greater than the duration of the recording', () => {
      const duration = 'PT10S';
      const instruction = {
        start_of_cut: '00:00:00',
        end_of_cut: '00:00:11',
      };
      const errors = validateRequest(
        { id: '', source_recording_id: '', status: '', edit_instructions: [instruction] },
        duration
      );
      expect(errors).toEqual({ endTime: 'References cannot be greater than the duration of the recording' });
    });
  });
});
