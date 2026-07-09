import { formatDuration } from '../../../main/utils/format-duration';

describe('formatDuration', () => {
  it('should return empty string for null or undefined', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(undefined)).toBe('');
  });

  it('should return empty string for non-numeric input', () => {
    expect(formatDuration('abc')).toBe('');
    expect(formatDuration(NaN)).toBe('');
  });

  it('should clamp negative values to 00:00:00', () => {
    expect(formatDuration(-50)).toBe('00:00:00');
  });

  it('should format seconds less than a minute', () => {
    expect(formatDuration(5)).toBe('00:00:05');
    expect(formatDuration(59)).toBe('00:00:59');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(60)).toBe('00:01:00');
    expect(formatDuration(125)).toBe('00:02:05');
  });

  it('should format hours correctly', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('should handle large durations', () => {
    expect(formatDuration(86399)).toBe('23:59:59');
    expect(formatDuration(86400)).toBe('24:00:00');
  });

  it('should pad single digit values with leading zeros', () => {
    expect(formatDuration(7)).toBe('00:00:07');
    expect(formatDuration(70)).toBe('00:01:10');
    expect(formatDuration(3700)).toBe('01:01:40');
  });
});
