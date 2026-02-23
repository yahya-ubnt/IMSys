const nodemailer = require('nodemailer');
const ApplicationSettings = require('../../models/ApplicationSettings');
const { decrypt } = require('../../utils/crypto');
const { sendEmail } = require('../../services/emailService');

// Mock dependencies
jest.mock('nodemailer');
jest.mock('../../models/ApplicationSettings');
jest.mock('../../utils/crypto');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    const mockTenantId = 'tenant-123';
    const mockSmtpSettings = {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'user@example.com',
      pass: 'encrypted-password',
      from: 'Sender <sender@example.com>',
    };
    const emailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    };

    it('should send an email successfully with correct settings', async () => {
      // Arrange
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
      const mockTransport = { sendMail: mockSendMail };
      nodemailer.createTransport.mockReturnValue(mockTransport);
      ApplicationSettings.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ smtpSettings: mockSmtpSettings }),
      });
      decrypt.mockReturnValue('decrypted-password');

      // Act
      await sendEmail({ ...emailOptions, tenant: mockTenantId });

      // Assert
      expect(ApplicationSettings.findOne).toHaveBeenCalledWith({ tenant: mockTenantId });
      expect(decrypt).toHaveBeenCalledWith('encrypted-password');
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user@example.com',
          pass: 'decrypted-password',
        },
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'Sender <sender@example.com>',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Body',
        html: undefined,
      });
    });

    it('should throw an error if SMTP settings are not configured', async () => {
      // Arrange
      ApplicationSettings.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null), // No settings found
      });

      // Act & Assert
      await expect(sendEmail({ ...emailOptions, tenant: mockTenantId }))
        .rejects.toThrow('SMTP settings are not configured for this tenant.');
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should throw an error if SMTP password is not set', async () => {
      // Arrange
      const settingsWithoutPassword = { ...mockSmtpSettings, pass: null };
      ApplicationSettings.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ smtpSettings: settingsWithoutPassword }),
      });

      // Act & Assert
      await expect(sendEmail({ ...emailOptions, tenant: mockTenantId }))
        .rejects.toThrow('SMTP password is not set.');
      expect(decrypt).not.toHaveBeenCalled();
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('should use a default "from" address if not provided in settings', async () => {
        // Arrange
        const settingsWithoutFrom = { ...mockSmtpSettings, from: null };
        const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
        nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
        ApplicationSettings.findOne.mockReturnValue({
          select: jest.fn().mockResolvedValue({ smtpSettings: settingsWithoutFrom }),
        });
        decrypt.mockReturnValue('decrypted-password');
  
        // Act
        await sendEmail({ ...emailOptions, tenant: mockTenantId });
  
        // Assert
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
          from: '"ISP Management" <no-reply@example.com>',
        }));
      });

    it('should re-throw errors from nodemailer', async () => {
      // Arrange
      const nodemailerError = new Error('Nodemailer failed');
      const mockSendMail = jest.fn().mockRejectedValue(nodemailerError);
      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
      ApplicationSettings.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ smtpSettings: mockSmtpSettings }),
      });
      decrypt.mockReturnValue('decrypted-password');

      // Act & Assert
      await expect(sendEmail({ ...emailOptions, tenant: mockTenantId }))
        .rejects.toThrow('Nodemailer failed');
    });
  });
});
