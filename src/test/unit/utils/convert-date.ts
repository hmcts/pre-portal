import { formatDateToDDMMYYYY } from '../../../main/utils/convert-date';

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
