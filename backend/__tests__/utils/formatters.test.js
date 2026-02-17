const { formatPhoneNumber } = require('../../utils/formatters');

describe('formatPhoneNumber', () => {
  it('should remove the leading + from a phone number', () => {
    expect(formatPhoneNumber('+254712345678')).toBe('254712345678');
  });

  it('should replace leading 07 with 254', () => {
    expect(formatPhoneNumber('0712345678')).toBe('254712345678');
  });

  it('should prepend 254 to a number starting with 7', () => {
    expect(formatPhoneNumber('712345678')).toBe('254712345678');
  });

  it('should return the number as is if it does not match any format', () => {
    expect(formatPhoneNumber('1234567890')).toBe('1234567890');
  });

  it('should return the number as is if it is already correctly formatted', () => {
    expect(formatPhoneNumber('254712345678')).toBe('254712345678');
  });
});
