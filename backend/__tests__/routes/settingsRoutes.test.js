
const request = require('supertest');
const express = require('express');
const settingsRoutes = require('../../routes/settingsRoutes');
const { protect, isAdmin, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const settingsController = require('../../controllers/settingsController');
const { body } = require('express-validator');
const multer = require('multer');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next()),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/settingsController', () => ({
  getGeneralSettings: jest.fn((req, res) => res.status(200).json({ message: 'General settings' })),
  updateGeneralSettings: jest.fn((req, res) => res.status(200).json({ message: 'General settings updated' })),
  getMpesaSettings: jest.fn((req, res) => res.status(200).json({ message: 'Mpesa settings' })),
  updateMpesaSettings: jest.fn((req, res) => res.status(200).json({ message: 'Mpesa settings updated' })),
  activateMpesa: jest.fn((req, res) => res.status(200).json({ message: 'Mpesa activated' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
  // This function will act as a mock for any chainable method (e.g., isMongoId, not, isEmpty, etc.)
  const mockChainableMethod = jest.fn().mockReturnThis();

  // This object will represent the chainable API (e.g., body('field').isMongoId()...)
  const mockChain = {
    isNumeric: mockChainableMethod,
    optional: mockChainableMethod,
    isIn: mockChainableMethod,
    not: jest.fn(() => mockChain), // `not()` also returns a chainable object
    isEmpty: mockChainableMethod,
    isString: mockChainableMethod,
    if: jest.fn(() => mockChain), // if() returns the chainable object itself
    equals: mockChainableMethod,
    // Add any other chainable methods used in your routes here
  };

  // This is the actual middleware function that Express will execute.
  // It also needs to have the chainable methods attached to it,
  // because `body('field')` itself returns a middleware function that is also chainable.
  const mockMiddleware = (req, res, next) => next();
  Object.assign(mockMiddleware, mockChain); // Attach chainable methods to the middleware function

  return {
    body: jest.fn(() => mockMiddleware),
    validationResult: jest.fn(() => ({
      isEmpty: () => true, // Always pass validation
    })),
  };
});

// Mock multer
jest.mock('multer', () => {
    const multer = () => ({
      fields: jest.fn(() => (req, res, next) => next()),
    });
    multer.diskStorage = jest.fn();
    return multer;
  });

const app = express();
app.use(express.json());
app.use('/api/settings', settingsRoutes);

describe('Settings Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/settings/general should get general settings', async () => {
    const res = await request(app).get('/api/settings/general');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'General settings' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(settingsController.getGeneralSettings).toHaveBeenCalled();
  });

  it('PUT /api/settings/general should update general settings', async () => {
    const res = await request(app).put('/api/settings/general').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'General settings updated' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(multer().fields).toHaveBeenCalled(); // Ensure multer middleware is called
    expect(settingsController.updateGeneralSettings).toHaveBeenCalled();
  });

  it('GET /api/settings/mpesa should get M-Pesa settings', async () => {
    const res = await request(app).get('/api/settings/mpesa');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Mpesa settings' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(settingsController.getMpesaSettings).toHaveBeenCalled();
  });

  it('PUT /api/settings/mpesa should update M-Pesa settings', async () => {
    const res = await request(app).put('/api/settings/mpesa').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Mpesa settings updated' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(settingsController.updateMpesaSettings).toHaveBeenCalled();
  });

  it('POST /api/settings/mpesa/activate should activate M-Pesa', async () => {
    const res = await request(app).post('/api/settings/mpesa/activate').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Mpesa activated' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(settingsController.activateMpesa).toHaveBeenCalled();
  });
});
