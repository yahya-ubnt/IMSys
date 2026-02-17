const RouterOSAPI = require('node-routeros').RouterOSAPI;
const Device = require('../../models/Device');
const DowntimeLog = require('../../models/DowntimeLog');
const MikrotikRouter = require('../../models/MikrotikRouter');
const { decrypt } = require('../../utils/crypto');
const { sendConsolidatedAlert } = require('../../services/alertingService');
const { checkAllDevices, pingWithRetry } = require('../../services/monitoringService');

jest.mock('node-routeros');
jest.mock('../../models/Device');
jest.mock('../../models/DowntimeLog');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/crypto');
jest.mock('../../services/alertingService');
jest.mock('../../services/monitoringService', () => {
    const originalModule = jest.requireActual('../../services/monitoringService');
    return {
        ...originalModule,
        pingWithRetry: jest.fn(),
    };
});

describe('checkAllDevices', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      connect: jest.fn().mockResolvedValue(),
      write: jest.fn(),
      close: jest.fn(),
      connected: true,
    };
    RouterOSAPI.mockImplementation(() => mockClient);
    decrypt.mockReturnValue('decrypted-password');

    const finalDevicePopulate = jest.fn().mockResolvedValue([]);
    const firstDevicePopulate = jest.fn().mockReturnValue({ populate: finalDevicePopulate });
    Device.find.mockReturnValue({ populate: firstDevicePopulate });

    DowntimeLog.findOne.mockResolvedValue(null);
  });

  const mockTenantId = 'tenant-123';
  const mockRouter = {
    _id: 'router-1',
    name: 'Test Router',
    ipAddress: '192.168.88.1',
    apiUsername: 'admin',
    apiPassword: 'encrypted-password',
    apiPort: 8728,
  };

  it('should do nothing if no devices are found for the tenant', async () => {
    await checkAllDevices(mockTenantId);
    expect(RouterOSAPI).not.toHaveBeenCalled();
  });

  it('should handle a device that is UP and stays UP', async () => {
    const mockDevice = { _id: 'device-1', ipAddress: '10.0.0.1', status: 'UP', tenant: mockTenantId, router: mockRouter };
    Device.find().populate().populate.mockResolvedValue([mockDevice]);
    mockClient.write.mockResolvedValue([{ received: '1' }]);

    await checkAllDevices(mockTenantId);

    expect(Device.updateOne).toHaveBeenCalledWith({ _id: 'device-1' }, { $set: { status: 'UP', lastSeen: expect.any(Date) } });
    expect(DowntimeLog.findOne).not.toHaveBeenCalled();
  });

  it('should handle a device that was DOWN and comes back UP', async () => {
    const mockDevice = { _id: 'device-1', ipAddress: '10.0.0.1', status: 'DOWN', tenant: mockTenantId, router: mockRouter };
    const mockOpenLog = {
      _id: 'log-1',
      downStartTime: new Date(Date.now() - 10000),
      save: jest.fn().mockResolvedValue(true),
    };
    Device.find().populate().populate.mockResolvedValue([mockDevice]);
    DowntimeLog.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockOpenLog) });
    mockClient.write.mockResolvedValue([{ received: '1' }]);

    await checkAllDevices(mockTenantId);

    expect(mockOpenLog.save).toHaveBeenCalled();
    expect(Device.updateOne).toHaveBeenCalledWith({ _id: 'device-1' }, { $set: { status: 'UP', lastSeen: expect.any(Date) } });
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockDevice], 'UP', mockTenantId, null, 'Device');
  });

  it('should handle a device that is UP and goes DOWN', async () => {
    const mockDevice = { _id: 'device-1', ipAddress: '10.0.0.1', status: 'UP', tenant: mockTenantId, router: mockRouter };
    Device.find().populate().populate.mockResolvedValue([mockDevice]);
    mockClient.write.mockResolvedValue([{ received: '0' }]);
    pingWithRetry.mockResolvedValue(false); // Simulates failed retries
    DowntimeLog.findOne.mockResolvedValue(null);


    await checkAllDevices(mockTenantId);

    expect(DowntimeLog.create).toHaveBeenCalledWith({
      tenant: mockTenantId,
      device: 'device-1',
      downStartTime: expect.any(Date),
    });
    expect(Device.updateOne).toHaveBeenCalledWith({ _id: 'device-1' }, { $set: { status: 'DOWN' } });
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockDevice], 'DOWN', mockTenantId, null, 'Device');
  });

  it('should handle a device that is already DOWN and stays DOWN', async () => {
    const mockDevice = { _id: 'device-1', ipAddress: '10.0.0.1', status: 'DOWN', tenant: mockTenantId, router: mockRouter };
    Device.find().populate().populate.mockResolvedValue([mockDevice]);
    mockClient.write.mockResolvedValue([{ received: '0' }]);
    DowntimeLog.findOne.mockResolvedValue({ _id: 'log-1' });

    await checkAllDevices(mockTenantId);

    expect(DowntimeLog.create).not.toHaveBeenCalled();
    expect(Device.updateOne).toHaveBeenCalledWith({ _id: 'device-1' }, { $set: { status: 'DOWN' } });
    expect(sendConsolidatedAlert).not.toHaveBeenCalled();
  });

  it('should handle router connection failure', async () => {
    const mockDevice = { _id: 'device-1', ipAddress: '10.0.0.1', status: 'UP', tenant: mockTenantId, router: mockRouter };
    Device.find().populate().populate.mockResolvedValue([mockDevice]);
    mockClient.connect.mockRejectedValue(new Error('Connection failed'));

    await checkAllDevices(mockTenantId);

    expect(Device.updateOne).toHaveBeenCalledWith({ _id: 'device-1' }, { $set: { status: 'DOWN' } });
    expect(DowntimeLog.create).toHaveBeenCalled();
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockDevice], 'DOWN (Router Unreachable)', mockTenantId, null, 'Device');
  });
});