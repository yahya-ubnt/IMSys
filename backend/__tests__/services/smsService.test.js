// Mock Models
jest.mock('../../models/SmsProvider');
jest.mock('../../models/SmsAcknowledgement');
jest.mock('../../models/SmsLog');

// Mock the SMS drivers
jest.mock('../../services/smsDrivers/celcom.js', () => ({
  sendMessage: jest.fn().mockResolvedValue({ success: true, message: 'Celcom mock success' }),
}));
jest.mock('../../services/smsDrivers/twilio.js', () => ({
    sendMessage: jest.fn().mockResolvedValue({ success: true, message: 'Twilio mock success' }),
}));

const SmsProvider = require('../../models/SmsProvider');
const SmsAcknowledgement = require('../../models/SmsAcknowledgement');
const SmsLog = require('../../models/SmsLog');
const smsService = require('../../services/smsService');

// Import the mocked drivers to access their mock functions
const celcomDriver = require('../../services/smsDrivers/celcom.js');
const twilioDriver = require('../../services/smsDrivers/twilio.js');


describe('smsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSMS', () => {
    it('should return an error if no active provider is found', async () => {
      SmsProvider.findOne.mockResolvedValue(null);
      const result = await smsService.sendSMS('tenant-1', '12345', 'Test');
      expect(SmsProvider.findOne).toHaveBeenCalledWith({ tenant: 'tenant-1', isActive: true });
      expect(result.success).toBe(false);
      expect(result.message).toBe('SMS service is not configured for this tenant. No active provider found.');
    });

    it('should call the correct driver for the active provider', async () => {
      const mockProvider = {
        providerType: 'celcom',
        credentials: { apiKey: '123' }, // get function is mocked by default
      };
      SmsProvider.findOne.mockResolvedValue(mockProvider);

      const result = await smsService.sendSMS('tenant-1', '12345', 'Test');

      expect(celcomDriver.sendMessage).toHaveBeenCalledWith(mockProvider.credentials, '12345', 'Test');
      expect(twilioDriver.sendMessage).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return an error if the driver module is not found', async () => {
        const mockProvider = {
          providerType: 'nonexistent_driver',
          credentials: { apiKey: '123' },
        };
        SmsProvider.findOne.mockResolvedValue(mockProvider);
  
        const result = await smsService.sendSMS('tenant-1', '12345', 'Test');
        expect(result.success).toBe(false);
        expect(result.message).toContain("driver for 'nonexistent_driver' not found");
      });
  });

  describe('sendAcknowledgementSms', () => {
    // Spy on sendSMS to control its behavior and assert its calls
    let sendSmsSpy;
    beforeEach(() => {
        sendSmsSpy = jest.spyOn(smsService, 'sendSMS');
    });
    afterEach(() => {
        sendSmsSpy.mockRestore(); // Restore original sendSMS after each test
    });

    it('should return an error if no active acknowledgement mapping is found', async () => {
      SmsAcknowledgement.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const result = await smsService.sendAcknowledgementSms('TRIGGER_TYPE', '12345', { tenant: 'tenant-1' });

      expect(SmsAcknowledgement.findOne).toHaveBeenCalledWith({ triggerType: 'TRIGGER_TYPE', tenant: 'tenant-1', status: 'Active' });
      expect(sendSmsSpy).not.toHaveBeenCalled();
      expect(SmsLog.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('No active acknowledgement mapping found.');
    });

    it('should send a personalized SMS and log success', async () => {
      const mockTemplate = { messageBody: 'Hello {{officialName}}, your reference is {{mPesaRefNo}}.' };
      const mockAcknowledgement = { smsTemplate: mockTemplate };
      SmsAcknowledgement.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockAcknowledgement) });
      sendSmsSpy.mockResolvedValue({ success: true, message: 'SMS sent successfully' });
      SmsLog.create.mockResolvedValue({});

      const data = {
        tenant: 'tenant-1',
        officialName: 'John Doe',
        mPesaRefNo: 'ABC123XYZ',
        mikrotikUser: 'user-id-1',
      };
      const result = await smsService.sendAcknowledgementSms('TRIGGER_TYPE', '12345', data);

      expect(SmsAcknowledgement.findOne).toHaveBeenCalled();
      expect(sendSmsSpy).toHaveBeenCalledWith('tenant-1', '12345', 'Hello John Doe, your reference is ABC123XYZ.');
      expect(SmsLog.create).toHaveBeenCalledWith(expect.objectContaining({
        mobileNumber: '12345',
        message: 'Hello John Doe, your reference is ABC123XYZ.',
        smsStatus: 'Success',
        providerResponse: 'SMS sent successfully',
        tenant: 'tenant-1',
        mikrotikUser: 'user-id-1',
      }));
      expect(result.success).toBe(true);
    });

    it('should log failure if SMS sending fails', async () => {
      const mockTemplate = { messageBody: 'Hello {{officialName}}.' };
      const mockAcknowledgement = { smsTemplate: mockTemplate };
      SmsAcknowledgement.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockAcknowledgement) });
      sendSmsSpy.mockResolvedValue({ success: false, message: 'SMS failed due to network' });
      SmsLog.create.mockResolvedValue({});

      const data = {
        tenant: 'tenant-1',
        officialName: 'Jane Doe',
        mikrotikUser: 'user-id-2',
      };
      const result = await smsService.sendAcknowledgementSms('TRIGGER_TYPE', '54321', data);

      expect(sendSmsSpy).toHaveBeenCalledWith('tenant-1', '54321', 'Hello Jane Doe.');
      expect(SmsLog.create).toHaveBeenCalledWith(expect.objectContaining({
        smsStatus: 'Failed',
        providerResponse: 'SMS failed due to network',
      }));
      expect(result.success).toBe(false);
    });

    it('should return an error if tenant is not provided in data', async () => {
        const result = await smsService.sendAcknowledgementSms('TRIGGER_TYPE', '12345', {});
        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot send acknowledgement SMS without a tenant context.');
        expect(SmsAcknowledgement.findOne).not.toHaveBeenCalled();
        expect(sendSmsSpy).not.toHaveBeenCalled();
        expect(SmsLog.create).not.toHaveBeenCalled();
    });
  });
});