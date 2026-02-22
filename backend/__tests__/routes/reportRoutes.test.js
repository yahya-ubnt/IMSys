
const request = require('supertest');
const express = require('express');
const reportRoutes = require('../../routes/reportRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const reportController = require('../../controllers/reportController');
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
jest.mock('../../controllers/reportController', () => ({
  getLocationReport: jest.fn((req, res) => res.status(200).json({ message: 'Location report' })),
  getMpesaAlerts: jest.fn((req, res) => res.status(200).json({ message: 'Mpesa alerts' })),
  deleteMpesaAlert: jest.fn((req, res) => res.status(200).json({ message: `Mpesa alert ${req.params.id} deleted` })),
  getMpesaReport: jest.fn((req, res) => res.status(200).json({ message: 'Mpesa report' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
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
app.use('/api/reports', reportRoutes);

describe('Report Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const alertId = 'alert123';

  it('POST /api/reports/location should get a location report', async () => {
    const res = await request(app).post('/api/reports/location').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Location report' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(reportController.getLocationReport).toHaveBeenCalled();
  });

  it('GET /api/reports/mpesa-alerts should get M-Pesa alerts', async () => {
    const res = await request(app).get('/api/reports/mpesa-alerts');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Mpesa alerts' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(reportController.getMpesaAlerts).toHaveBeenCalled();
  });

  it('DELETE /api/reports/mpesa-alerts/:id should delete an M-Pesa alert', async () => {
    const res = await request(app).delete(`/api/reports/mpesa-alerts/${alertId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Mpesa alert ${alertId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(reportController.deleteMpesaAlert).toHaveBeenCalled();
  });

  it('POST /api/reports/mpesa-report should get an M-Pesa report', async () => {
    const res = await request(app).post('/api/reports/mpesa-report').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Mpesa report' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(reportController.getMpesaReport).toHaveBeenCalled();
  });
});
