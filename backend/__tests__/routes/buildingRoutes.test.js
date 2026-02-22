
const request = require('supertest');
const express = require('express');
const buildingRoutes = require('../../routes/buildingRoutes');
const { protect, isAdmin } = require('../../middlewares/protect');
const buildingController = require('../../controllers/buildingController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/buildingController', () => ({
  createBuilding: jest.fn((req, res) => res.status(201).json({ message: 'Building created' })),
  getBuildings: jest.fn((req, res) => res.status(200).json({ message: 'Get all buildings' })),
  getBuilding: jest.fn((req, res) => res.status(200).json({ message: `Get building ${req.params.id}` })),
  updateBuilding: jest.fn((req, res) => res.status(200).json({ message: `Update building ${req.params.id}` })),
  deleteBuilding: jest.fn((req, res) => res.status(200).json({ message: `Delete building ${req.params.id}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/buildings', buildingRoutes);

describe('Building Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/buildings should create a new building', async () => {
    const res = await request(app).post('/api/buildings').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Building created' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(buildingController.createBuilding).toHaveBeenCalled();
  });

  it('GET /api/buildings should get all buildings', async () => {
    const res = await request(app).get('/api/buildings');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all buildings' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(buildingController.getBuildings).toHaveBeenCalled();
  });

  it('GET /api/buildings/:id should get a building by ID', async () => {
    const buildingId = 'building123';
    const res = await request(app).get(`/api/buildings/${buildingId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get building ${buildingId}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(buildingController.getBuilding).toHaveBeenCalled();
  });

  it('PUT /api/buildings/:id should update a building by ID', async () => {
    const buildingId = 'building123';
    const res = await request(app).put(`/api/buildings/${buildingId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update building ${buildingId}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(buildingController.updateBuilding).toHaveBeenCalled();
  });

  it('DELETE /api/buildings/:id should delete a building by ID', async () => {
    const buildingId = 'building123';
    const res = await request(app).delete(`/api/buildings/${buildingId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete building ${buildingId}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(buildingController.deleteBuilding).toHaveBeenCalled();
  });
});
