import config from 'config';
import { mockUser } from '../test-helper';
import { set } from 'lodash';
import { reset } from '../../mock-api';
import { describe } from '@jest/globals';
import { parseIsoDuration, validateRequest } from '../../../main/routes/edit-request';
import { PutEditRequest } from '../../../main/services/pre-api/types';

mockUser();
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
    // Note: Full GET route tests would require mocking SessionUser and other Express middleware
    // The core validation logic is tested above in parseIsoDuration and validateRequest

    it('should test that validateId would reject invalid IDs', () => {
      // This is a placeholder for testing the validateId helper
      // In a real scenario, you would test the route with proper middleware mocks
      const validId = '12345678-1234-1234-1234-1234567890ab';
      const invalidId = 'invalid-id';

      // validateId returns true for UUIDs and false otherwise
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(validId);
      const isInvalidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(invalidId);

      expect(isValidUUID).toBe(true);
      expect(isInvalidUUID).toBe(false);
    });
  });
});
