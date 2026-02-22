
const request = require('supertest');
const express = require('express');
const mikrotikRouterRoutes = require('../../routes/mikrotikRouterRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const mikrotikRouterController = require('../../controllers/mikrotikRouterController');
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
jest.mock('../../controllers/mikrotikRouterController', () => ({
  createMikrotikRouter: jest.fn((req, res) => res.status(201).json({ message: 'Mikrotik router created' })),
  getMikrotikRouters: jest.fn((req, res) => res.status(200).json({ message: 'Get all Mikrotik routers' })),
  getMikrotikRouterById: jest.fn((req, res) => res.status(200).json({ message: `Get Mikrotik router ${req.params.id}` })),
  updateMikrotikRouter: jest.fn((req, res) => res.status(200).json({ message: `Update Mikrotik router ${req.params.id}` })),
  deleteMikrotikRouter: jest.fn((req, res) => res.status(200).json({ message: `Delete Mikrotik router ${req.params.id}` })),
  testMikrotikConnection: jest.fn((req, res) => res.status(200).json({ message: 'Mikrotik connection tested' })),
  getMikrotikPppProfiles: jest.fn((req, res) => res.status(200).json({ message: 'Get Mikrotik PPP profiles' })),
  getMikrotikPppServices: jest.fn((req, res) => res.status(200).json({ message: 'Get Mikrotik PPP services' })),
  getMikrotikRouterStatus: jest.fn((req, res) => res.status(200).json({ message: 'Get Mikrotik router status' })),
  getHotspotServers: jest.fn((req, res) => res.status(200).json({ message: 'Get Mikrotik Hotspot servers' })),
  getHotspotProfiles: jest.fn((req, res) => res.status(200).json({ message: 'Get Mikrotik Hotspot profiles' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isIP: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      isString: jest.fn().mockReturnThis(),
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
app.use('/api/mikrotik-routers', mikrotikRouterRoutes);

describe('Mikrotik Router Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/mikrotik-routers should create a new Mikrotik router', async () => {
    const res = await request(app).post('/api/mikrotik-routers').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Mikrotik router created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.createMikrotikRouter).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers should get all Mikrotik routers', async () => {
    const res = await request(app).get('/api/mikrotik-routers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all Mikrotik routers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getMikrotikRouters).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers/:id should get a Mikrotik router by ID', async () => {
    const routerId = 'router123';
    const res = await request(app).get(`/api/mikrotik-routers/${routerId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get Mikrotik router ${routerId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getMikrotikRouterById).toHaveBeenCalled();
  });

  it('PUT /api/mikrotik-routers/:id should update a Mikrotik router by ID', async () => {
    const routerId = 'router123';
    const res = await request(app).put(`/api/mikrotik-routers/${routerId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update Mikrotik router ${routerId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.updateMikrotikRouter).toHaveBeenCalled();
  });

  it('DELETE /api/mikrotik-routers/:id should delete a Mikrotik router by ID', async () => {
    const routerId = 'router123';
    const res = await request(app).delete(`/api/mikrotik-routers/${routerId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete Mikrotik router ${routerId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.deleteMikrotikRouter).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers/:id/status should get Mikrotik router status', async () => {
    const routerId = 'router123';
    const res = await request(app).get(`/api/mikrotik-routers/${routerId}/status`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get Mikrotik router status' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getMikrotikRouterStatus).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-routers/test-connection should test Mikrotik connection', async () => {
    const res = await request(app).post('/api/mikrotik-routers/test-connection').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Mikrotik connection tested' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.testMikrotikConnection).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers/:id/ppp-profiles should get Mikrotik PPP profiles', async () => {
    const routerId = 'router123';
    const res = await request(app).get(`/api/mikrotik-routers/${routerId}/ppp-profiles`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get Mikrotik PPP profiles' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getMikrotikPppProfiles).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers/:id/ppp-services should get Mikrotik PPP services', async () => {
    const routerId = 'router123';
    const res = await request(app).get(`/api/mikrotik-routers/${routerId}/ppp-services`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get Mikrotik PPP services' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getMikrotikPppServices).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers/:id/hotspot-servers should get Mikrotik Hotspot servers', async () => {
    const routerId = 'router123';
    const res = await request(app).get(`/api/mikrotik-routers/${routerId}/hotspot-servers`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get Mikrotik Hotspot servers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getHotspotServers).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-routers/:id/hotspot-profiles should get Mikrotik Hotspot profiles', async () => {
    const routerId = 'router123';
    const res = await request(app).get(`/api/mikrotik-routers/${routerId}/hotspot-profiles`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get Mikrotik Hotspot profiles' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikRouterController.getHotspotProfiles).toHaveBeenCalled();
  });
});
