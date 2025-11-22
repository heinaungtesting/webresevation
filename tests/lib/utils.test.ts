import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatTime } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle single class name', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toBe('base included');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle empty strings', () => {
      const result = cn('base', '', 'end');
      expect(result).toBe('base end');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      });
      expect(result).toBe('class1 class3');
    });

    it('should handle mixed inputs', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { 'conditional': true, 'false-conditional': false },
        true && 'inline-conditional',
        'end'
      );
      expect(result).toBe('base array1 array2 conditional inline-conditional end');
    });

    it('should handle no inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format Date object correctly with Japanese locale', () => {
      const date = new Date('2024-12-25T14:30:00');
      const result = formatDate(date);

      // Should follow Japanese format (YYYY/MM/DD HH:MM)
      expect(result).toMatch(/2024\/12\/25/);
      expect(result).toMatch(/14:30/);
    });

    it('should format string date correctly', () => {
      const result = formatDate('2024-12-25T14:30:00');

      expect(result).toMatch(/2024\/12\/25/);
      expect(result).toMatch(/14:30/);
    });

    it('should handle ISO date strings', () => {
      const result = formatDate('2024-01-15T09:45:00.000Z');

      // Note: This will be converted to JST (UTC+9), so 09:45 UTC becomes 18:45 JST
      expect(result).toMatch(/2024\/01\/15/);
    });

    it('should handle different months and days', () => {
      const result = formatDate('2024-03-05T08:15:30');

      expect(result).toMatch(/2024\/03\/05/);
      expect(result).toMatch(/08:15/);
    });

    it('should pad single digit months and days', () => {
      const result = formatDate('2024-01-01T01:05:00');

      // Japanese format should pad with zeros
      expect(result).toMatch(/2024\/01\/01/);
      expect(result).toMatch(/01:05/);
    });

    it('should handle leap year dates', () => {
      const result = formatDate('2024-02-29T12:00:00');

      expect(result).toMatch(/2024\/02\/29/);
      expect(result).toMatch(/12:00/);
    });

    it('should handle edge case dates', () => {
      // Test year boundary
      const result1 = formatDate('2024-12-31T23:59:00');
      expect(result1).toMatch(/2024\/12\/31/);
      expect(result1).toMatch(/23:59/);

      // Test year start
      const result2 = formatDate('2024-01-01T00:01:00');
      expect(result2).toMatch(/2024\/01\/01/);
      expect(result2).toMatch(/00:01/);
    });
  });

  describe('formatTime', () => {
    it('should format time from Date object correctly', () => {
      const date = new Date('2024-12-25T14:30:00');
      const result = formatTime(date);

      expect(result).toBe('14:30');
    });

    it('should format time from string correctly', () => {
      const result = formatTime('2024-12-25T14:30:00');

      expect(result).toBe('14:30');
    });

    it('should handle morning hours', () => {
      const result = formatTime('2024-12-25T08:15:00');

      expect(result).toBe('08:15');
    });

    it('should handle evening hours', () => {
      const result = formatTime('2024-12-25T20:45:00');

      expect(result).toBe('20:45');
    });

    it('should handle midnight', () => {
      const result = formatTime('2024-12-25T00:00:00');

      expect(result).toBe('00:00');
    });

    it('should handle noon', () => {
      const result = formatTime('2024-12-25T12:00:00');

      expect(result).toBe('12:00');
    });

    it('should handle late night', () => {
      const result = formatTime('2024-12-25T23:59:00');

      expect(result).toBe('23:59');
    });

    it('should pad single digit hours and minutes', () => {
      const result1 = formatTime('2024-12-25T01:05:00');
      expect(result1).toBe('01:05');

      const result2 = formatTime('2024-12-25T09:08:00');
      expect(result2).toBe('09:08');
    });

    it('should handle ISO date strings with timezone', () => {
      const result = formatTime('2024-01-15T09:45:00.000Z');

      // Note: This will be converted to JST (UTC+9)
      // 09:45 UTC becomes 18:45 JST
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should ignore date part and only show time', () => {
      const result1 = formatTime('2020-01-01T15:30:00');
      const result2 = formatTime('2030-12-31T15:30:00');

      // Both should show same time regardless of date
      expect(result1).toBe('15:30');
      expect(result2).toBe('15:30');
    });

    it('should handle seconds in input but not include in output', () => {
      const result1 = formatTime('2024-12-25T14:30:45');
      const result2 = formatTime('2024-12-25T14:30:00');

      // Both should show same time (seconds ignored in format)
      expect(result1).toBe('14:30');
      expect(result2).toBe('14:30');
    });
  });

  describe('Date format integration', () => {
    it('should have consistent behavior between formatDate and formatTime', () => {
      const dateStr = '2024-12-25T14:30:00';

      const fullDate = formatDate(dateStr);
      const timeOnly = formatTime(dateStr);

      // The time part of formatDate should match formatTime
      expect(fullDate).toContain(timeOnly);
    });

    it('should handle same input types consistently', () => {
      const dateObj = new Date('2024-12-25T14:30:00');
      const dateStr = '2024-12-25T14:30:00';

      const dateFromObj = formatDate(dateObj);
      const dateFromStr = formatDate(dateStr);
      const timeFromObj = formatTime(dateObj);
      const timeFromStr = formatTime(dateStr);

      // Results should be the same regardless of input type
      expect(dateFromObj).toBe(dateFromStr);
      expect(timeFromObj).toBe(timeFromStr);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid date strings by throwing expected errors', () => {
      // Invalid date strings should throw RangeError as expected
      expect(() => formatDate('invalid-date')).toThrow(RangeError);
      expect(() => formatTime('invalid-date')).toThrow(RangeError);
    });

    it('should handle empty strings by throwing expected errors', () => {
      // Empty strings create invalid dates which throw RangeError
      expect(() => formatDate('')).toThrow(RangeError);
      expect(() => formatTime('')).toThrow(RangeError);
    });

    it('should handle valid edge case dates properly', () => {
      // Test with valid dates that might be edge cases
      expect(() => formatDate('1970-01-01T00:00:00Z')).not.toThrow();
      expect(() => formatTime('1970-01-01T00:00:00Z')).not.toThrow();

      // Test with far future dates
      expect(() => formatDate('2099-12-31T23:59:59Z')).not.toThrow();
      expect(() => formatTime('2099-12-31T23:59:59Z')).not.toThrow();
    });
  });
});