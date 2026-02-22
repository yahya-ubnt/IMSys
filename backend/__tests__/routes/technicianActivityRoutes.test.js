
const request = require('supertest');
const express = require('express');
const technicianActivityRoutes = require('../../routes/technicianActivityRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const technicianActivityController = require('../../controllers/technicianActivityController');
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
jest.mock('../../controllers/technicianActivityController', () => ({
  createTechnicianActivity: jest.fn((req, res) => res.status(201).json({ message: 'Technician activity created' })),
  getTechnicianActivities: jest.fn((req, res) => res.status(200).json({ message: 'Get all technician activities' })),
  getTechnicianActivityById: jest.fn((req, res) => res.status(200).json({ message: `Get technician activity ${req.params.id}` })),
  updateTechnicianActivity: jest.fn((req, res) => res.status(200).json({ message: `Update technician activity ${req.params.id}` })),
  deleteTechnicianActivity: jest.fn((req, res) => res.status(200).json({ message: `Delete technician activity ${req.params.id}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
  // This function will act as a mock for any chainable method (e.g., isMongoId, not, isEmpty, etc.)
  const mockChainableMethod = jest.fn().mockReturnThis();

  // This object will represent the chainable API (e.g., body('field').isMongoId()...)
  const mockChain = {
    not: jest.fn(() => mockChain),
    isEmpty: mockChainableMethod,
    isIn: mockChainableMethod,
    matches: mockChainableMethod,
    isISO8601: mockChainableMethod,
    toDate: mockChainableMethod,
    optional: mockChainableMethod,
    isMongoId: mockChainableMethod,
    if: jest.fn(() => mockChain),
    equals: mockChainableMethod,
  };

  // This is the actual middleware function that Express will execute.
  // It also needs to have the chainable methods attached to it,
  // because `body('field')` itself returns a middleware function that is also chainable.
  const mockMiddleware = (req, res, next) => next();
  Object.assign(mockMiddleware, mockChain);

  return {
    body: jest.fn(() => mockMiddleware),
    validationResult: jest.fn(() => ({
      isEmpty: () => true, // Always pass validation
    })),
  };
});

const app = express();
app.use(express.json());
app.use('/api/technician-activities', technicianActivityRoutes);

describe('Technician Activity Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const activityId = 'activity123';

  it('POST /api/technician-activities should create a new technician activity', async () => {
    const res = await request(app).post('/api/technician-activities').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Technician activity created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(technicianActivityController.createTechnicianActivity).toHaveBeenCalled();
  });

  it('GET /api/technician-activities should get all technician activities', async () => {
    const res = await request(app).get('/api/technician-activities');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all technician activities' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(technicianActivityController.getTechnicianActivities).toHaveBeenCalled();
  });

  it('GET /api/technician-activities/:id should get a technician activity by ID', async () => {
    const res = await request(app).get(`/api/technician-activities/${activityId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get technician activity ${activityId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(technicianActivityController.getTechnicianActivityById).toHaveBeenCalled();
  });

  it('PUT /api/technician-activities/:id should update a technician activity by ID', async () => {
    const res = await request(app).put(`/api/technician-activities/${activityId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update technician activity ${activityId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(technicianActivityController.updateTechnicianActivity).toHaveBeenCalled();
  });

  it('DELETE /api/technician-activities/:id should delete a technician activity by ID', async () => {
    const res = await request(app).delete(`/api/technician-activities/${activityId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete technician activity ${activityId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(technicianActivityController.deleteTechnicianActivity).toHaveBeenCalled();
  });
});
