
const request = require('supertest');
const express = require('express');
const smsExpiryScheduleRoutes = require('../../routes/smsExpiryScheduleRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const smsExpiryScheduleController = require('../../controllers/smsExpiryScheduleController');
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
jest.mock('../../controllers/smsExpiryScheduleController', () => ({
  getSchedules: jest.fn((req, res) => res.status(200).json({ message: 'Get all SMS expiry schedules' })),
  createSchedule: jest.fn((req, res) => res.status(201).json({ message: 'SMS expiry schedule created' })),
  getScheduleById: jest.fn((req, res) => res.status(200).json({ message: `Get SMS expiry schedule ${req.params.id}` })),
  updateSchedule: jest.fn((req, res) => res.status(200).json({ message: `SMS expiry schedule ${req.params.id} updated` })),
  deleteSchedule: jest.fn((req, res) => res.status(200).json({ message: `SMS expiry schedule ${req.params.id} deleted` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isNumeric: jest.fn().mockReturnThis(),
      isIn: jest.fn().mockReturnThis(),
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
app.use('/api/sms-expiry-schedules', smsExpiryScheduleRoutes);

describe('SMS Expiry Schedule Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const scheduleId = 'schedule123';

  it('GET /api/sms-expiry-schedules should get all SMS expiry schedules', async () => {
    const res = await request(app).get('/api/sms-expiry-schedules');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all SMS expiry schedules' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsExpiryScheduleController.getSchedules).toHaveBeenCalled();
  });

  it('POST /api/sms-expiry-schedules should create a new SMS expiry schedule', async () => {
    const res = await request(app).post('/api/sms-expiry-schedules').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'SMS expiry schedule created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsExpiryScheduleController.createSchedule).toHaveBeenCalled();
  });

  it('GET /api/sms-expiry-schedules/:id should get an SMS expiry schedule by ID', async () => {
    const res = await request(app).get(`/api/sms-expiry-schedules/${scheduleId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get SMS expiry schedule ${scheduleId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsExpiryScheduleController.getScheduleById).toHaveBeenCalled();
  });

  it('PUT /api/sms-expiry-schedules/:id should update an SMS expiry schedule by ID', async () => {
    const res = await request(app).put(`/api/sms-expiry-schedules/${scheduleId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS expiry schedule ${scheduleId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsExpiryScheduleController.updateSchedule).toHaveBeenCalled();
  });

  it('DELETE /api/sms-expiry-schedules/:id should delete an SMS expiry schedule by ID', async () => {
    const res = await request(app).delete(`/api/sms-expiry-schedules/${scheduleId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS expiry schedule ${scheduleId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsExpiryScheduleController.deleteSchedule).toHaveBeenCalled();
  });
});
