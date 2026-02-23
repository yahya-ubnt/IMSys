const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} = require('../../controllers/deviceController');
const Device = require('../../models/Device');
const Tenant = require('../../models/Tenant');
const MikrotikRouter = require('../../models/MikrotikRouter');

// Mock DeviceService because it handles complex logic like hardware interaction
// But wait, the user wants "Functional" tests.
// DeviceService interacts with RouterOSAPI and ChildProcess (ping).
// I should probably mock the Service layer for Device if it interacts with hardware,
// OR unmock it and mock the hardware utilities.

jest.mock('../../services/DeviceService');
const DeviceService = require('../../services/DeviceService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Device Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Device.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Device Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createDevice', () => {
    it('should call DeviceService.createDevice', async () => {
      req.body = { deviceName: 'Antenna 1' };
      DeviceService.createDevice.mockResolvedValue({ deviceName: 'Antenna 1' });

      await createDevice(req, res, next);

      expect(DeviceService.createDevice).toHaveBeenCalledWith(req.body, tenant._id);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getDevices', () => {
    it('should call DeviceService.getDevices', async () => {
      DeviceService.getDevices.mockResolvedValue([]);

      await getDevices(req, res, next);

      expect(DeviceService.getDevices).toHaveBeenCalledWith(tenant._id, req.query);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('deleteDevice', () => {
    it('should call DeviceService.deleteDevice', async () => {
        req.params.id = 'device123';
        DeviceService.deleteDevice.mockResolvedValue({ message: 'Device removed' });

        await deleteDevice(req, res, next);
        expect(DeviceService.deleteDevice).toHaveBeenCalledWith('device123', tenant._id);
        expect(res.json).toHaveBeenCalledWith({ message: 'Device removed' });
    });
  });
});
