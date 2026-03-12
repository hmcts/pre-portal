import config from 'config';
import { mockUser } from '../test-helper';
import { set } from 'lodash';
import { describe } from '@jest/globals';
import { PutEditRequest } from '../../../main/services/pre-api/types';
import { Nunjucks } from '../../../main/modules/nunjucks';
import { mockedEditRequest, mockGetCurrentEditRequest, mockGetRecording, reset } from '../../mock-api';
import { PreClient } from '../../../main/services/pre-api/pre-client';

mockUser();
const { parseIsoDuration, validateRequest } = require('../../../main/routes/edit-request');
set(config, 'pre.enableAutomatedEditing', 'true');

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
      expect(result && result['overlap']).toContain('Overlapping Instructions');
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

  describe('on GET /edit-request/:id', () => {
    const app = require('express')();
    new Nunjucks(false).enableFor(app);
    const request = require('supertest');

    const editRequestRoute = require('../../../main/routes/edit-request').default;
    editRequestRoute(app);

    beforeEach(() => {
      reset();
    });

    test('should return 404 when id is invalid', async () => {
      await request(app).get('/edit-request/invalid-id').expect(404);
    });

    test('should return 404 when recording is not found', async () => {
      mockGetRecording(null);

      await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ff').expect(404);
    });

    test('should return 404 when edit request is not found', async () => {
      mockGetRecording();
      mockGetCurrentEditRequest(null);

      await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab').expect(404);
    });

    test('should redirect to /edit-request/:id/view when status is not editable', async () => {
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
        .expect(302)
        .expect('Location', '/edit-request/12345678-1234-1234-1234-1234567890ab/view');
    });

    test('should render edit-request page and write audit event when status is editable', async () => {
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

    test('should return 500 when getRecording fails', async () => {
      jest.spyOn(PreClient.prototype, 'getRecording').mockImplementation(async () => {
        throw new Error('Error');
      });

      await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab').expect(500);
    });

    test('should return 500 when getCurrentEditRequest fails', async () => {
      mockGetRecording();
      jest.spyOn(PreClient.prototype, 'getMostRecentEditRequests').mockImplementation(async () => {
        throw new Error('Error');
      });

      await request(app).get('/edit-request/12345678-1234-1234-1234-1234567890ab').expect(500);
    });
  });
});
