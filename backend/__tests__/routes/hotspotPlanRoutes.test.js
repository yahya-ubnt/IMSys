
const request = require('supertest');
const express = require('express');
const hotspotPlanRoutes = require('../../routes/hotspotPlanRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const hotspotPlanController = require('../../controllers/hotspotPlanController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/hotspotPlanController', () => ({
  createHotspotPlan: jest.fn((req, res) => res.status(201).json({ message: 'Hotspot plan created' })),
  getHotspotPlans: jest.fn((req, res) => res.status(200).json({ message: 'Get all hotspot plans' })),
  getPublicHotspotPlans: jest.fn((req, res) => res.status(200).json({ message: 'Get public hotspot plans' })),
  getHotspotPlanById: jest.fn((req, res) => res.status(200).json({ message: `Get hotspot plan ${req.params.id}` })),
  updateHotspotPlan: jest.fn((req, res) => res.status(200).json({ message: `Update hotspot plan ${req.params.id}` })),
  deleteHotspotPlan: jest.fn((req, res) => res.status(200).json({ message: `Delete hotspot plan ${req.params.id}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/hotspot-plans', hotspotPlanRoutes);

describe('Hotspot Plan Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/hotspot-plans/public/plans should get public hotspot plans', async () => {
    const res = await request(app).get('/api/hotspot-plans/public/plans');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get public hotspot plans' });
    expect(hotspotPlanController.getPublicHotspotPlans).toHaveBeenCalled();
  });

  it('POST /api/hotspot-plans should create a new hotspot plan', async () => {
    const res = await request(app).post('/api/hotspot-plans').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Hotspot plan created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotPlanController.createHotspotPlan).toHaveBeenCalled();
  });

  it('GET /api/hotspot-plans should get all hotspot plans', async () => {
    const res = await request(app).get('/api/hotspot-plans');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all hotspot plans' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotPlanController.getHotspotPlans).toHaveBeenCalled();
  });

  it('GET /api/hotspot-plans/:id should get a hotspot plan by ID', async () => {
    const planId = 'plan123';
    const res = await request(app).get(`/api/hotspot-plans/${planId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get hotspot plan ${planId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotPlanController.getHotspotPlanById).toHaveBeenCalled();
  });

  it('PUT /api/hotspot-plans/:id should update a hotspot plan by ID', async () => {
    const planId = 'plan123';
    const res = await request(app).put(`/api/hotspot-plans/${planId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update hotspot plan ${planId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotPlanController.updateHotspotPlan).toHaveBeenCalled();
  });

  it('DELETE /api/hotspot-plans/:id should delete a hotspot plan by ID', async () => {
    const planId = 'plan123';
    const res = await request(app).delete(`/api/hotspot-plans/${planId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete hotspot plan ${planId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotPlanController.deleteHotspotPlan).toHaveBeenCalled();
  });
});
