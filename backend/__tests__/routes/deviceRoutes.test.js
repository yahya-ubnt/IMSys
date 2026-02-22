
const request = require('supertest');
const express = require('express');
const deviceRoutes = require('../../routes/deviceRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const deviceController = require('../../controllers/deviceController');
const mikrotikUserController = require('../../controllers/mikrotikUserController');
const { body } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/deviceController', () => ({
  createDevice: jest.fn((req, res) => res.status(201).json({ message: 'Device created' })),
  getDevices: jest.fn((req, res) => res.status(200).json({ message: 'Get all devices' })),
  getDeviceById: jest.fn((req, res) => res.status(200).json({ message: `Get device ${req.params.id}` })),
  updateDevice: jest.fn((req, res) => res.status(200).json({ message: `Update device ${req.params.id}` })),
  deleteDevice: jest.fn((req, res) => res.status(200).json({ message: `Delete device ${req.params.id}` })),
  getDeviceDowntimeLogs: jest.fn((req, res) => res.status(200).json({ message: `Get downtime logs for device ${req.params.id}` })),
  pingDevice: jest.fn((req, res) => res.status(200).json({ message: `Ping device ${req.params.id}` })),
  enableMonitoring: jest.fn((req, res) => res.status(200).json({ message: `Enable monitoring for device ${req.params.id}` })),
}));

jest.mock('../../controllers/mikrotikUserController', () => ({
    getMikrotikUsersByStation: jest.fn((req, res) => res.status(200).json({ message: `Get Mikrotik users for station ${req.params.stationId}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isIn: jest.fn().mockReturnThis(),
    };
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChainable);
  
    return {
      body: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

const app = express();
app.use(express.json());
app.use('/api/devices', deviceRoutes);

describe('Device Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/devices should create a new device', async () => {
    const res = await request(app).post('/api/devices').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Device created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.createDevice).toHaveBeenCalled();
  });

  it('GET /api/devices should get all devices', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all devices' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.getDevices).toHaveBeenCalled();
  });

  it('GET /api/devices/:id should get a device by ID', async () => {
    const deviceId = 'device123';
    const res = await request(app).get(`/api/devices/${deviceId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get device ${deviceId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.getDeviceById).toHaveBeenCalled();
  });

  it('PUT /api/devices/:id should update a device by ID', async () => {
    const deviceId = 'device123';
    const res = await request(app).put(`/api/devices/${deviceId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update device ${deviceId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.updateDevice).toHaveBeenCalled();
  });

  it('DELETE /api/devices/:id should delete a device by ID', async () => {
    const deviceId = 'device123';
    const res = await request(app).delete(`/api/devices/${deviceId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete device ${deviceId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.deleteDevice).toHaveBeenCalled();
  });

  it('GET /api/devices/:id/downtime should get device downtime logs', async () => {
    const deviceId = 'device123';
    const res = await request(app).get(`/api/devices/${deviceId}/downtime`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get downtime logs for device ${deviceId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.getDeviceDowntimeLogs).toHaveBeenCalled();
  });

  it('POST /api/devices/:id/ping should ping a device', async () => {
    const deviceId = 'device123';
    const res = await request(app).post(`/api/devices/${deviceId}/ping`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Ping device ${deviceId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.pingDevice).toHaveBeenCalled();
  });

  it('POST /api/devices/:id/enable-monitoring should enable monitoring for a device', async () => {
    const deviceId = 'device123';
    const res = await request(app).post(`/api/devices/${deviceId}/enable-monitoring`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Enable monitoring for device ${deviceId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(deviceController.enableMonitoring).toHaveBeenCalled();
  });

  it('GET /api/devices/:stationId/users should get Mikrotik users by station', async () => {
    const stationId = 'station123';
    const res = await request(app).get(`/api/devices/${stationId}/users`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get Mikrotik users for station ${stationId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMikrotikUsersByStation).toHaveBeenCalled();
  });
});
