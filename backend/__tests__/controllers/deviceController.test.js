const {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getDeviceDowntimeLogs,
  pingDevice,
  enableMonitoring,
} = require('../../controllers/deviceController');
const DeviceService = require('../../services/DeviceService');
const { validationResult } = require('express-validator');

jest.mock('../../services/DeviceService', () => ({
  createDevice: jest.fn(),
  getDevices: jest.fn(),
  getDeviceById: jest.fn(),
  updateDevice: jest.fn(),
  deleteDevice: jest.fn(),
  getDeviceDowntimeLogs: jest.fn(),
  pingDevice: jest.fn(),
  enableMonitoring: jest.fn(),
}));
jest.mock('express-validator');

describe('deviceController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'tenant-1' },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDevice', () => {
    it('should call DeviceService.createDevice and return the result', async () => {
      const mockDevice = { name: 'Test Device' };
      DeviceService.createDevice.mockResolvedValue(mockDevice);
      await createDevice(req, res, next);
      expect(DeviceService.createDevice).toHaveBeenCalledWith(req.body, req.user.tenant);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockDevice);
    });
  });

  describe('getDevices', () => {
    it('should call DeviceService.getDevices and return the result', async () => {
      const mockDevices = [{ name: 'Device 1' }];
      DeviceService.getDevices.mockResolvedValue(mockDevices);
      await getDevices(req, res, next);
      expect(DeviceService.getDevices).toHaveBeenCalledWith(req.user.tenant, req.query);
      expect(res.json).toHaveBeenCalledWith(mockDevices);
    });
  });

  describe('getDeviceById', () => {
    it('should call DeviceService.getDeviceById and return the result', async () => {
      req.params.id = 'device-1';
      const mockDevice = { name: 'Device 1' };
      DeviceService.getDeviceById.mockResolvedValue(mockDevice);
      await getDeviceById(req, res, next);
      expect(DeviceService.getDeviceById).toHaveBeenCalledWith('device-1', req.user.tenant);
      expect(res.json).toHaveBeenCalledWith(mockDevice);
    });
  });

  describe('updateDevice', () => {
    it('should call DeviceService.updateDevice and return the result', async () => {
      req.params.id = 'device-1';
      req.body = { name: 'Updated Device' };
      const mockDevice = { name: 'Updated Device' };
      DeviceService.updateDevice.mockResolvedValue(mockDevice);
      await updateDevice(req, res, next);
      expect(DeviceService.updateDevice).toHaveBeenCalledWith('device-1', req.body, req.user.tenant);
      expect(res.json).toHaveBeenCalledWith(mockDevice);
    });
  });

  describe('deleteDevice', () => {
    it('should call DeviceService.deleteDevice and return the result', async () => {
      req.params.id = 'device-1';
      const message = { message: 'Device removed' };
      DeviceService.deleteDevice.mockResolvedValue(message);
      await deleteDevice(req, res, next);
      expect(DeviceService.deleteDevice).toHaveBeenCalledWith('device-1', req.user.tenant);
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });

  describe('getDeviceDowntimeLogs', () => {
    it('should call DeviceService.getDeviceDowntimeLogs and return the result', async () => {
      req.params.id = 'device-1';
      const logs = [{ log: 'log1' }];
      DeviceService.getDeviceDowntimeLogs.mockResolvedValue(logs);
      await getDeviceDowntimeLogs(req, res, next);
      expect(DeviceService.getDeviceDowntimeLogs).toHaveBeenCalledWith('device-1', req.user.tenant);
      expect(res.json).toHaveBeenCalledWith(logs);
    });
  });

  describe('pingDevice', () => {
    it('should call DeviceService.pingDevice and return the result', async () => {
      req.params.id = 'device-1';
      const result = { success: true };
      DeviceService.pingDevice.mockResolvedValue(result);
      await pingDevice(req, res, next);
      expect(DeviceService.pingDevice).toHaveBeenCalledWith('device-1', req.user.tenant);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe('enableMonitoring', () => {
    it('should call DeviceService.enableMonitoring and return the result', async () => {
      req.params.id = 'device-1';
      const result = { success: true };
      DeviceService.enableMonitoring.mockResolvedValue(result);
      await enableMonitoring(req, res, next);
      expect(DeviceService.enableMonitoring).toHaveBeenCalledWith('device-1', req.user.tenant);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });
});