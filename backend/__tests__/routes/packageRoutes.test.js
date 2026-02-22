
const request = require('supertest');
const express = require('express');
const packageRoutes = require('../../routes/packageRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const packageController = require('../../controllers/packageController');
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
jest.mock('../../controllers/packageController', () => ({
  createPackage: jest.fn((req, res) => res.status(201).json({ message: 'Package created' })),
  getPackages: jest.fn((req, res) => res.status(200).json({ message: 'Get all packages' })),
  getPackageById: jest.fn((req, res) => res.status(200).json({ message: `Get package ${req.params.id}` })),
  updatePackage: jest.fn((req, res) => res.status(200).json({ message: `Update package ${req.params.id}` })),
  deletePackage: jest.fn((req, res) => res.status(200).json({ message: `Delete package ${req.params.id}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isNumeric: jest.fn().mockReturnThis(),
      isString: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
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
app.use('/api/packages', packageRoutes);

describe('Package Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const packageId = 'package123';

  it('POST /api/packages should create a new package', async () => {
    const res = await request(app).post('/api/packages').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Package created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(packageController.createPackage).toHaveBeenCalled();
  });

  it('GET /api/packages should get all packages', async () => {
    const res = await request(app).get('/api/packages');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all packages' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(packageController.getPackages).toHaveBeenCalled();
  });

  it('GET /api/packages/:id should get a package by ID', async () => {
    const res = await request(app).get(`/api/packages/${packageId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get package ${packageId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(packageController.getPackageById).toHaveBeenCalled();
  });

  it('PUT /api/packages/:id should update a package by ID', async () => {
    const res = await request(app).put(`/api/packages/${packageId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update package ${packageId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(packageController.updatePackage).toHaveBeenCalled();
  });

  it('DELETE /api/packages/:id should delete a package by ID', async () => {
    const res = await request(app).delete(`/api/packages/${packageId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete package ${packageId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(packageController.deletePackage).toHaveBeenCalled();
  });
});
