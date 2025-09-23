import { formatDateToDDMMYYYY, isValidDateString, toIsoDateString } from '../../../main/utils/convert-date';

describe('Date Utils', () => {
  describe('formatDateToDDMMYYYY', () => {
    it('should return empty string when input is undefined', () => {
      expect(formatDateToDDMMYYYY()).toBe('');
    });

    it('should return empty string when input is empty', () => {
      expect(formatDateToDDMMYYYY('')).toBe('');
    });

    it('should return empty string when input is invalid date', () => {
      expect(formatDateToDDMMYYYY('not-a-date')).toBe('');
      expect(formatDateToDDMMYYYY('2023-13-01')).toBe('');
    });

    it('should format valid ISO date to DD/MM/YYYY', () => {
      expect(formatDateToDDMMYYYY('2023-09-16')).toBe('16/09/2023');
    });

    it('should handle datetime strings correctly', () => {
      expect(formatDateToDDMMYYYY('2023-01-05T10:20:30Z')).toBe('05/01/2023');
    });

    it('should pad single digit day and month with leading zeros', () => {
      expect(formatDateToDDMMYYYY('2023-02-03')).toBe('03/02/2023');
    });
  });

  describe('isValidDateString', () => {
    it('should return false for undefined or empty string', () => {
      expect(isValidDateString(undefined)).toBe(false);
      expect(isValidDateString('')).toBe(false);
    });

    it('should return true for valid ISO dates', () => {
      expect(isValidDateString('2023-09-16')).toBe(true);
      expect(isValidDateString('2023-01-05T10:20:30Z')).toBe(true);
      expect(isValidDateString('2023-01-05T10:20:30.123Z')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDateString('6/09/2023')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
    });
  });

  describe('toIsoDateString', () => {
    it('should return empty string for undefined or empty input', () => {
      expect(toIsoDateString(undefined)).toBe('');
      expect(toIsoDateString('')).toBe('');
    });

    it('should convert UK format DD/MM/YYYY to ISO YYYY-MM-DD', () => {
      expect(toIsoDateString('16/09/2023')).toBe('2023-09-16');
      expect(toIsoDateString('05/01/2023')).toBe('2023-01-05');
    });

    it('should return ISO string unchanged', () => {
      expect(toIsoDateString('2023-09-16')).toBe('2023-09-16');
      expect(toIsoDateString('2023-01-05T10:20:30Z')).toBe('2023-01-05T10:20:30Z');
    });

    it('should return empty string for invalid formats', () => {
      expect(toIsoDateString('not-a-date')).toBe('');
      expect(toIsoDateString('16-09-2023')).toBe('');
    });
  });
});
