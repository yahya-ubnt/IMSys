
const request = require('supertest');
const express = require('express');
const smsProviderRoutes = require('../../routes/smsProviderRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const smsProviderController = require('../../controllers/smsProviderController');
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
jest.mock('../../controllers/smsProviderController', () => ({
  getSmsProviders: jest.fn((req, res) => res.status(200).json({ message: 'Get all SMS providers' })),
  createSmsProvider: jest.fn((req, res) => res.status(201).json({ message: 'SMS provider created' })),
  getSmsProviderById: jest.fn((req, res) => res.status(200).json({ message: `Get SMS provider ${req.params.id}` })),
  updateSmsProvider: jest.fn((req, res) => res.status(200).json({ message: `SMS provider ${req.params.id} updated` })),
  deleteSmsProvider: jest.fn((req, res) => res.status(200).json({ message: `SMS provider ${req.params.id} deleted` })),
  setActiveSmsProvider: jest.fn((req, res) => res.status(200).json({ message: `SMS provider ${req.params.id} set active` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isIn: jest.fn().mockReturnThis(),
      isObject: jest.fn().mockReturnThis(),
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
app.use('/api/sms-providers', smsProviderRoutes);

describe('SMS Provider Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const providerId = 'provider123';

  it('GET /api/sms-providers should get all SMS providers', async () => {
    const res = await request(app).get('/api/sms-providers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all SMS providers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsProviderController.getSmsProviders).toHaveBeenCalled();
  });

  it('POST /api/sms-providers should create a new SMS provider', async () => {
    const res = await request(app).post('/api/sms-providers').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'SMS provider created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsProviderController.createSmsProvider).toHaveBeenCalled();
  });

  it('GET /api/sms-providers/:id should get an SMS provider by ID', async () => {
    const res = await request(app).get(`/api/sms-providers/${providerId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get SMS provider ${providerId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsProviderController.getSmsProviderById).toHaveBeenCalled();
  });

  it('PUT /api/sms-providers/:id should update an SMS provider by ID', async () => {
    const res = await request(app).put(`/api/sms-providers/${providerId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS provider ${providerId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsProviderController.updateSmsProvider).toHaveBeenCalled();
  });

  it('DELETE /api/sms-providers/:id should delete an SMS provider by ID', async () => {
    const res = await request(app).delete(`/api/sms-providers/${providerId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS provider ${providerId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsProviderController.deleteSmsProvider).toHaveBeenCalled();
  });

  it('POST /api/sms-providers/:id/set-active should set an SMS provider as active', async () => {
    const res = await request(app).post(`/api/sms-providers/${providerId}/set-active`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS provider ${providerId} set active` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsProviderController.setActiveSmsProvider).toHaveBeenCalled();
  });
});
