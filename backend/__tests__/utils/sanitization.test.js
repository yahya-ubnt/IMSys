const { sanitizeString, sanitizeObject } = require('../../utils/sanitization');

describe('sanitization utilities', () => {
  describe('sanitizeString', () => {
    it('should remove a simple script tag', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert("xss")&lt;/script&gt;';
      expect(sanitizeString(input)).toBe(expected);
    });

    it('should handle strings without malicious content', () => {
      const input = 'This is a clean string.';
      expect(sanitizeString(input)).toBe(input);
    });

    it('should return non-string inputs as they are', () => {
      expect(sanitizeString(null)).toBeNull();
      expect(sanitizeString(undefined)).toBeUndefined();
      expect(sanitizeString(123)).toBe(123);
      const obj = { a: 1 };
      expect(sanitizeString(obj)).toBe(obj);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string properties in a flat object', () => {
      const input = {
        name: 'Safe Name',
        comment: '<script>alert("xss")</script>',
        age: 30,
      };
      const expected = {
        name: 'Safe Name',
        comment: '&lt;script&gt;alert("xss")&lt;/script&gt;',
        age: 30,
      };
      expect(sanitizeObject(input)).toEqual(expected);
    });

    it('should recursively sanitize nested objects', () => {
      const input = {
        user: {
          name: 'John <script>alert("name")</script>',
          details: {
            bio: 'A bio with <img src=x onerror=alert(1)>',
          },
        },
        id: 1,
      };
      const expected = {
        user: {
          name: 'John &lt;script&gt;alert("name")&lt;/script&gt;',
          details: {
            bio: 'A bio with <img src>',
          },
        },
        id: 1,
      };
      expect(sanitizeObject(input)).toEqual(expected);
    });

    it('should handle arrays of objects', () => {
      const input = [
        { text: 'clean' },
        { text: '<script>alert(1)</script>' },
      ];
      const expected = [
        { text: 'clean' },
        { text: '&lt;script&gt;alert(1)&lt;/script&gt;' },
      ];
      expect(sanitizeObject(input)).toEqual(expected);
    });

    it('should return non-object inputs as they are', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject('a string')).toBe('a string');
      expect(sanitizeObject(123)).toBe(123);
    });
  });
});
