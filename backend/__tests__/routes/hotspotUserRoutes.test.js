
const request = require('supertest');
const express = require('express');
const hotspotUserRoutes = require('../../routes/hotspotUserRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const hotspotUserController = require('../../controllers/hotspotUserController');
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
jest.mock('../../controllers/hotspotUserController', () => ({
  createHotspotUser: jest.fn((req, res) => res.status(201).json({ message: 'Hotspot user created' })),
  getHotspotUsers: jest.fn((req, res) => res.status(200).json({ message: 'Get all hotspot users' })),
  getHotspotUserById: jest.fn((req, res) => res.status(200).json({ message: `Get hotspot user ${req.params.id}` })),
  updateHotspotUser: jest.fn((req, res) => res.status(200).json({ message: `Update hotspot user ${req.params.id}` })),
  deleteHotspotUser: jest.fn((req, res) => res.status(200).json({ message: `Delete hotspot user ${req.params.id}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      matches: jest.fn().mockReturnThis(),
      isMongoId: jest.fn().mockReturnThis(),
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
app.use('/api/hotspot-users', hotspotUserRoutes);

describe('Hotspot User Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/hotspot-users should create a new hotspot user', async () => {
    const res = await request(app).post('/api/hotspot-users').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Hotspot user created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotUserController.createHotspotUser).toHaveBeenCalled();
  });

  it('GET /api/hotspot-users should get all hotspot users', async () => {
    const res = await request(app).get('/api/hotspot-users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all hotspot users' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotUserController.getHotspotUsers).toHaveBeenCalled();
  });

  it('GET /api/hotspot-users/:id should get a hotspot user by ID', async () => {
    const userId = 'user123';
    const res = await request(app).get(`/api/hotspot-users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get hotspot user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotUserController.getHotspotUserById).toHaveBeenCalled();
  });

  it('PUT /api/hotspot-users/:id should update a hotspot user by ID', async () => {
    const userId = 'user123';
    const res = await request(app).put(`/api/hotspot-users/${userId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update hotspot user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotUserController.updateHotspotUser).toHaveBeenCalled();
  });

  it('DELETE /api/hotspot-users/:id should delete a hotspot user by ID', async () => {
    const userId = 'user123';
    const res = await request(app).delete(`/api/hotspot-users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete hotspot user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotUserController.deleteHotspotUser).toHaveBeenCalled();
  });
});
