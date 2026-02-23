
jest.mock('../../models/Device');
jest.mock('../../models/DowntimeLog');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/sanitization', () => ({
  sanitizeString: jest.fn(str => str), // Mock to return string as is
}));
jest.mock('../../utils/mikrotikUtils', () => ({
  checkCPEStatus: jest.fn(),
}));
jest.mock('../../queues/mikrotikSyncQueue', () => ({
  add: jest.fn(),
}));

const DeviceService = require('../../services/DeviceService');
const Device = require('../../models/Device');
const MikrotikRouter = require('../../models/MikrotikRouter');
const DowntimeLog = require('../../models/DowntimeLog');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');
const { checkCPEStatus } = require('../../utils/mikrotikUtils');

describe('DeviceService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDevice', () => {
    it('should create a new device successfully', async () => {
      const deviceData = {
        router: 'router-1',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'Test Device',
        deviceType: 'Station',
      };
      const tenantId = 'tenant-1';

      MikrotikRouter.findOne.mockResolvedValue({ _id: 'router-1', tenant: tenantId });
      Device.findOne.mockResolvedValue(null); // No existing device
      Device.prototype.save = jest.fn().mockResolvedValue({ _id: 'device-1', ...deviceData, tenant: tenantId });

      const result = await DeviceService.createDevice(deviceData, tenantId);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'router-1', tenant: tenantId });
      expect(Device.findOne).toHaveBeenCalledWith({ macAddress: 'AA:BB:CC:DD:EE:FF', tenant: tenantId });
      expect(Device.prototype.save).toHaveBeenCalled();
      expect(result.deviceName).toBe('Test Device');
    });

    it('should throw an error if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);
      const deviceData = { router: 'router-nonexistent' };
      const tenantId = 'tenant-1';

      await expect(DeviceService.createDevice(deviceData, tenantId)).rejects.toThrow('Router not found');
    });

    it('should throw an error if device with MAC address already exists', async () => {
      MikrotikRouter.findOne.mockResolvedValue({ _id: 'router-1' });
      Device.findOne.mockResolvedValue({ _id: 'device-existing' });
      const deviceData = { router: 'router-1', macAddress: 'AA:BB:CC:DD:EE:FF' };
      const tenantId = 'tenant-1';

      await expect(DeviceService.createDevice(deviceData, tenantId)).rejects.toThrow('Device with this MAC address already exists');
    });
  });

  describe('getDevices', () => {
    it('should return all devices for a tenant', async () => {
      const mockDevices = [{ _id: 'd1' }, { _id: 'd2' }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockDevices), // Final resolution
      };
      Device.find.mockReturnValue(mockQuery);

      const result = await DeviceService.getDevices('tenant-1', {});
      expect(Device.find).toHaveBeenCalledWith({ tenant: 'tenant-1' });
      expect(result).toEqual(mockDevices);
    });

    it('should filter devices by deviceType', async () => {
      const mockDevices = [{ _id: 'd1', deviceType: 'Access' }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockDevices), // Final resolution
      };
      Device.find.mockReturnValue(mockQuery);

      const result = await DeviceService.getDevices('tenant-1', { deviceType: 'Access' });
      expect(Device.find).toHaveBeenCalledWith({ tenant: 'tenant-1', deviceType: 'Access' });
      expect(result).toEqual(mockDevices);
    });
  });

  describe('getDeviceById', () => {
    it('should return a device by ID', async () => {
      const mockDevice = { _id: 'd1', deviceType: 'Station', ssid: 'test-ssid', toObject: () => ({ _id: 'd1', deviceType: 'Station', ssid: 'test-ssid' }) };
      
      const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          then: jest.fn(function(resolve) { resolve(mockDevice); }), // Make the query thenable
      };
      Device.findOne.mockReturnValue(mockQuery);
      Device.find.mockResolvedValue([]); // No connected stations
      // Device.findOne.mockResolvedValue(null); // No connected AP - this is for the other branch

      const result = await DeviceService.getDeviceById('d1', 'tenant-1');
      expect(Device.findOne).toHaveBeenCalledWith({ _id: 'd1', tenant: 'tenant-1' });
      expect(mockQuery.populate).toHaveBeenCalledWith('router', 'name ipAddress');
      expect(mockQuery.populate).toHaveBeenCalledWith('physicalBuilding', 'name');
      expect(result._id).toBe('d1');
    });

    it('should populate connected stations for an Access device', async () => {
        const mockAccessDevice = { _id: 'd1', deviceType: 'Access', ssid: 'test-ssid', toObject: () => ({ _id: 'd1', deviceType: 'Access', ssid: 'test-ssid' }) };
        const mockStation = { _id: 's1', deviceType: 'Station' };
        
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            then: jest.fn(function(resolve) { resolve(mockAccessDevice); }),
        };
        Device.findOne.mockReturnValue(mockQuery);
        Device.find.mockResolvedValue([mockStation]); // Connected stations
  
        const result = await DeviceService.getDeviceById('d1', 'tenant-1');
        expect(Device.find).toHaveBeenCalledWith({ deviceType: 'Station', ssid: 'test-ssid', tenant: 'tenant-1' });
        expect(result.connectedStations).toEqual([mockStation]);
      });
  });

  describe('updateDevice', () => {
    it('should update a device successfully', async () => {
      const mockDevice = { _id: 'd1', deviceName: 'Old Name', save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }) };
      Device.findOne.mockResolvedValue(mockDevice);

      const updateData = { deviceName: 'New Name' };
      const result = await DeviceService.updateDevice('d1', updateData, 'tenant-1');

      expect(mockDevice.deviceName).toBe('New Name');
      expect(mockDevice.save).toHaveBeenCalled();
      expect(result.deviceName).toBe('New Name');
    });

    it('should throw an error if device not found', async () => {
      Device.findOne.mockResolvedValue(null);
      await expect(DeviceService.updateDevice('d1', {}, 'tenant-1')).rejects.toThrow('Device not found');
    });
  });

  describe('deleteDevice', () => {
    it('should delete a device and its downtime logs', async () => {
      const mockDevice = { _id: 'd1', deleteOne: jest.fn().mockResolvedValue(true) };
      Device.findOne.mockResolvedValue(mockDevice);
      DowntimeLog.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const result = await DeviceService.deleteDevice('d1', 'tenant-1');

      expect(DowntimeLog.deleteMany).toHaveBeenCalledWith({ device: 'd1' });
      expect(mockDevice.deleteOne).toHaveBeenCalled();
      expect(result.message).toBe('Device and associated downtime logs removed');
    });

    it('should throw an error if device not found', async () => {
      Device.findOne.mockResolvedValue(null);
      await expect(DeviceService.deleteDevice('d1', 'tenant-1')).rejects.toThrow('Device not found');
    });
  });

  describe('getDeviceDowntimeLogs', () => {
    it('should return downtime logs for a device', async () => {
      const mockDevice = { _id: 'd1' };
      const mockLogs = [{ _id: 'log1' }];
      Device.findOne.mockResolvedValue(mockDevice);
      DowntimeLog.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockLogs) });

      const result = await DeviceService.getDeviceDowntimeLogs('d1', 'tenant-1');
      expect(Device.findOne).toHaveBeenCalledWith({ _id: 'd1', tenant: 'tenant-1' });
      expect(DowntimeLog.find).toHaveBeenCalledWith({ device: 'd1' });
      expect(result).toEqual(mockLogs);
    });

    it('should throw an error if device not found', async () => {
      Device.findOne.mockResolvedValue(null);
      await expect(DeviceService.getDeviceDowntimeLogs('d1', 'tenant-1')).rejects.toThrow('Device not found');
    });
  });

  describe('pingDevice', () => {
    it('should return reachable status if device is online', async () => {
      const mockDevice = { _id: 'd1' };
      const mockRouter = { _id: 'r1' };
      Device.findOne.mockResolvedValue(mockDevice);
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      checkCPEStatus.mockResolvedValue(true);

      const result = await DeviceService.pingDevice('d1', 'tenant-1');
      expect(Device.findOne).toHaveBeenCalledWith({ _id: 'd1', tenant: 'tenant-1' });
      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ tenant: 'tenant-1', isCoreRouter: true });
      expect(checkCPEStatus).toHaveBeenCalledWith(mockDevice, mockRouter);
      expect(result).toEqual({ success: true, status: 'Reachable' });
    });

    it('should return unreachable status if device is offline', async () => {
      const mockDevice = { _id: 'd1' };
      const mockRouter = { _id: 'r1' };
      Device.findOne.mockResolvedValue(mockDevice);
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      checkCPEStatus.mockResolvedValue(false);

      const result = await DeviceService.pingDevice('d1', 'tenant-1');
      expect(result).toEqual({ success: true, status: 'Unreachable' });
    });

    it('should throw an error if device not found', async () => {
      Device.findOne.mockResolvedValue(null);
      await expect(DeviceService.pingDevice('d1', 'tenant-1')).rejects.toThrow('Device not found');
    });

    it('should throw an error if no core router is configured', async () => {
      Device.findOne.mockResolvedValue({ _id: 'd1' });
      MikrotikRouter.findOne.mockResolvedValue(null);
      await expect(DeviceService.pingDevice('d1', 'tenant-1')).rejects.toThrow('No core router is configured for this tenant to perform the check.');
    });
  });

  describe('enableMonitoring', () => {
    it('should add an enableNetwatch job to the queue', async () => {
      const mockDevice = { _id: 'd1' };
      Device.findOne.mockResolvedValue(mockDevice);
      mikrotikSyncQueue.add.mockResolvedValue(true);

      const result = await DeviceService.enableMonitoring('d1', 'tenant-1');
      expect(Device.findOne).toHaveBeenCalledWith({ _id: 'd1', tenant: 'tenant-1' });
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('enableNetwatch', { deviceId: 'd1', tenantId: 'tenant-1' });
      expect(result).toEqual({ success: true, message: 'Monitoring injection queued successfully.' });
    });

    it('should throw an error if device not found', async () => {
      Device.findOne.mockResolvedValue(null);
      await expect(DeviceService.enableMonitoring('d1', 'tenant-1')).rejects.toThrow('Device not found');
    });
  });
});
