
const request = require('supertest');
const express = require('express');
const smsRoutes = require('../../routes/smsRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const smsController = require('../../controllers/smsController');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/smsController', () => ({
  getSmsTriggers: jest.fn((req, res) => res.status(200).json({ message: 'Get SMS triggers' })),
  composeAndSendSms: jest.fn((req, res) => res.status(200).json({ message: 'SMS composed and sent' })),
  getSentSmsLog: jest.fn((req, res) => res.status(200).json({ message: 'Get sent SMS log' })),
  exportSmsLogs: jest.fn((req, res) => res.status(200).json({ message: 'SMS logs exported' })),
  getSmsLogsForUserController: jest.fn((req, res) => res.status(200).json({ message: `Get SMS logs for user ${req.params.userId}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
  // This function will act as a mock for any chainable method (e.g., isMongoId, not, isEmpty, etc.)
  const mockChainableMethod = jest.fn().mockReturnThis();

  // This object will represent the chainable API (e.g., body('field').isMongoId()...)
  const mockChain = {}; // Define mockChain first

  Object.assign(mockChain, {
    not: jest.fn(() => mockChain), // `not()` also returns a chainable object
    isEmpty: mockChainableMethod,
    isIn: mockChainableMethod,
    isArray: mockChainableMethod,
    custom: jest.fn(() => mockChain), // custom() returns the chainable object itself
    matches: mockChainableMethod,
    if: jest.fn(() => mockChain), // if() returns the chainable object itself
    equals: mockChainableMethod,
    // Add any other chainable methods used in your routes here
  });

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

// Mock express-rate-limit
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));

const app = express();
app.use(express.json());
app.use('/api/sms', smsRoutes);

describe('SMS Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user123';

  it('GET /api/sms/triggers should get SMS triggers', async () => {
    const res = await request(app).get('/api/sms/triggers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get SMS triggers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.getSmsTriggers).toHaveBeenCalled();
  });

  it('POST /api/sms/compose should compose and send SMS', async () => {
    const res = await request(app).post('/api/sms/compose').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'SMS composed and sent' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.composeAndSendSms).toHaveBeenCalled();
  });

  it('GET /api/sms/log should get sent SMS log', async () => {
    const res = await request(app).get('/api/sms/log');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get sent SMS log' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.getSentSmsLog).toHaveBeenCalled();
  });

  it('GET /api/sms/log/export should export SMS logs', async () => {
    const res = await request(app).get('/api/sms/log/export');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'SMS logs exported' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.exportSmsLogs).toHaveBeenCalled();
  });

  it('GET /api/sms/logs/user/:userId should get SMS logs for a specific user', async () => {
    const res = await request(app).get(`/api/sms/logs/user/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get SMS logs for user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.getSmsLogsForUserController).toHaveBeenCalled();
  });
});
