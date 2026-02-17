const { sendConsolidatedAlert } = require('../../services/alertingService');
const Notification = require('../../models/Notification');
const ApplicationSettings = require('../../models/ApplicationSettings');
const emailService = require('../../services/emailService');
const socket = require('../../socket');

// Mock the entire models and services
jest.mock('../../models/Notification');
jest.mock('../../models/ApplicationSettings');
jest.mock('../../services/emailService');
jest.mock('../../socket');

describe('AlertingService', () => {
  beforeEach(() => {
    // Clear all mocks and reset implementations before each test
    jest.clearAllMocks();

    // Mock the Notification constructor and its save method
    const mockSave = jest.fn().mockResolvedValue(true);
    Notification.mockImplementation(function(data) {
      // Merge data into the mock instance
      Object.assign(this, data);
      this.save = mockSave;
      return this;
    });

    // Mock ApplicationSettings.findOne
    ApplicationSettings.findOne.mockResolvedValue(null); // Default to no settings found

    // Mock emailService
    emailService.sendEmail.mockResolvedValue();

    // Mock socket.io
    const ioMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    socket.getIO.mockReturnValue(ioMock);
  });

  describe('sendConsolidatedAlert', () => {
    const mockTenantId = 'tenant-123';
    const mockDevice = { deviceName: 'Test Device', macAddress: '00:00:00:00:00:00', ipAddress: '1.1.1.1', deviceType: 'Device' };
    const mockUser = { username: 'testuser', ipAddress: '2.2.2.2' };

    it('should save a notification for a single device', async () => {
      await sendConsolidatedAlert([mockDevice], 'offline', mockTenantId);

      expect(Notification).toHaveBeenCalledWith({
        message: 'ALERT: Device Test Device (1.1.1.1) is now offline.',
        type: 'device_status',
        tenant: mockTenantId,
      });
      
      const mockNotificationInstance = Notification.mock.instances[0];
      expect(mockNotificationInstance.save).toHaveBeenCalled();
    });

    it('should save a notification for a single user', async () => {
      await sendConsolidatedAlert([mockUser], 'disconnected', mockTenantId, null, 'User');

      expect(Notification).toHaveBeenCalledWith({
        message: 'ALERT: User testuser (2.2.2.2) is now disconnected.',
        type: 'device_status',
        tenant: mockTenantId,
      });
      const mockNotificationInstance = Notification.mock.instances[0];
      expect(mockNotificationInstance.save).toHaveBeenCalled();
    });

    it('should save a notification for multiple devices', async () => {
      const devices = [
        { deviceName: 'Device1', macAddress: '01:00:00:00:00:00', deviceType: 'Access' },
        { deviceName: 'Device2', macAddress: '02:00:00:00:00:00', deviceType: 'Access' },
      ];
      await sendConsolidatedAlert(devices, 'online', mockTenantId);

      expect(Notification).toHaveBeenCalledWith(expect.objectContaining({
        message: 'ALERT: Multiple Access (Device1, Device2) are now online.',
      }));
      const mockNotificationInstance = Notification.mock.instances[0];
      expect(mockNotificationInstance.save).toHaveBeenCalled();
    });

    it('should send an email if admin notification emails are configured', async () => {
      ApplicationSettings.findOne.mockResolvedValue({
        tenant: mockTenantId,
        adminNotificationEmails: ['admin@test.com', 'admin2@test.com'],
      });

      await sendConsolidatedAlert([mockDevice], 'offline', mockTenantId);

      expect(ApplicationSettings.findOne).toHaveBeenCalledWith({ tenant: mockTenantId });
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
      expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'admin@test.com',
        subject: 'System Alert: ALERT: Device Test Device (1.1.1.1) is now offline.',
      }));
    });

    it('should NOT send an email if admin emails are not configured', async () => {
      ApplicationSettings.findOne.mockResolvedValue({
        tenant: mockTenantId,
        adminNotificationEmails: [], // No emails
      });

      await sendConsolidatedAlert([mockDevice], 'offline', mockTenantId);

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should emit a socket event to the correct tenant room', async () => {
      await sendConsolidatedAlert([mockDevice], 'offline', mockTenantId);

      const mockNotificationInstance = Notification.mock.instances[0];
      const ioMock = socket.getIO();

      expect(ioMock.to).toHaveBeenCalledWith(mockTenantId.toString());
      expect(ioMock.emit).toHaveBeenCalledWith('new_notification', mockNotificationInstance);
    });

    it('should handle socket.io initialization errors gracefully', async () => {
      socket.getIO.mockImplementationOnce(() => {
        throw new Error('Socket.io not initialized');
      });

      await expect(sendConsolidatedAlert([mockDevice], 'offline', mockTenantId)).resolves.not.toThrow();
    });

    it('should log a warning and not proceed if entities array is empty', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await sendConsolidatedAlert([], 'offline', mockTenantId);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('sendConsolidatedAlert called with empty or invalid entities array.');
      expect(Notification).not.toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should log an error and not proceed if tenant is missing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await sendConsolidatedAlert([mockDevice], 'offline', null);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Could not determine tenant for alert.');
      expect(Notification).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});