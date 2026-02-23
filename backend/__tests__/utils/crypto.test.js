const { encrypt, decrypt } = require('../../utils/crypto');

describe('crypto utility', () => {
  it('should encrypt and then decrypt a string back to its original value', () => {
    const originalText = 'This is a secret message!';
    const encryptedText = encrypt(originalText);
    const decryptedText = decrypt(encryptedText);

    expect(encryptedText).not.toBe(originalText);
    expect(decryptedText).toBe(originalText);
  });

  it('should handle encryption and decryption of an empty string', () => {
    const originalText = '';
    const encryptedText = encrypt(originalText);
    const decryptedText = decrypt(encryptedText);

    expect(decryptedText).toBe(originalText);
  });

  it('should return null when encrypting null', () => {
    expect(encrypt(null)).toBeNull();
  });

  it('should return undefined when encrypting undefined', () => {
    expect(encrypt(undefined)).toBeUndefined();
  });

  it('should return the original value if decrypt is called with a non-encrypted string', () => {
    const nonEncrypted = 'just a plain string';
    expect(decrypt(nonEncrypted)).toBe(nonEncrypted);
  });

  it('should return null when decrypting null', () => {
    expect(decrypt(null)).toBeNull();
  });
});
