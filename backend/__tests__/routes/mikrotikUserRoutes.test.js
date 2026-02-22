
const request = require('supertest');
const express = require('express');
const mikrotikUserRoutes = require('../../routes/mikrotikUserRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const mikrotikUserController = require('../../controllers/mikrotikUserController');
const { body, param } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/mikrotikUserController', () => ({
  createMikrotikUser: jest.fn((req, res) => res.status(201).json({ message: 'Mikrotik user created' })),
  getMikrotikUsers: jest.fn((req, res) => res.status(200).json({ message: 'Get all Mikrotik users' })),
  getMikrotikUserById: jest.fn((req, res) => res.status(200).json({ message: `Get Mikrotik user ${req.params.id}` })),
  updateMikrotikUser: jest.fn((req, res) => res.status(200).json({ message: `Update Mikrotik user ${req.params.id}` })),
  deleteMikrotikUser: jest.fn((req, res) => res.status(200).json({ message: `Delete Mikrotik user ${req.params.id}` })),
  getMikrotikClientsForSms: jest.fn((req, res) => res.status(200).json({ message: 'Get Mikrotik clients for SMS' })),
  getMonthlyNewSubscribers: jest.fn((req, res) => res.status(200).json({ message: 'Get monthly new subscribers' })),
  getMonthlyPaidSubscribers: jest.fn((req, res) => res.status(200).json({ message: 'Get monthly paid subscribers' })),
  getMonthlyTotalSubscribers: jest.fn((req, res) => res.status(200).json({ message: 'Get monthly total subscribers' })),
  getMikrotikUserStatus: jest.fn((req, res) => res.status(200).json({ message: `Get status for user ${req.params.id}` })),
  getMikrotikUserTraffic: jest.fn((req, res) => res.status(200).json({ message: `Get traffic for user ${req.params.id}` })),
  getDowntimeLogs: jest.fn((req, res) => res.status(200).json({ message: `Get downtime logs for user ${req.params.userId}` })),
  getDelayedPayments: jest.fn((req, res) => res.status(200).json({ message: 'Get delayed payments' })),
  getUserPaymentStats: jest.fn((req, res) => res.status(200).json({ message: `Get payment stats for user ${req.params.id}` })),
  manualDisconnectUser: jest.fn((req, res) => res.status(200).json({ message: `User ${req.params.id} disconnected` })),
  manualConnectUser: jest.fn((req, res) => res.status(200).json({ message: `User ${req.params.id} connected` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
  // This is the mock object that will be returned by chainable methods
  const mockValidationChain = {
    isMongoId: jest.fn().mockReturnThis(),
    isIn: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    isEmpty: jest.fn().mockReturnThis(),
    isISO8601: jest.fn().mockReturnThis(),
    toDate: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    if: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    // Add any other chainable methods used in your routes here
  };

  // This function will act as the middleware that the chain resolves to
  const middleware = (req, res, next) => next();

  // Assign all chainable methods to the middleware function itself
  Object.assign(middleware, mockValidationChain);

  return {
    body: jest.fn(() => middleware),
    param: jest.fn(() => middleware),
    query: jest.fn(() => middleware),
    validationResult: jest.fn(() => ({
      isEmpty: () => true, // Always pass validation
    })),
  };
});

const app = express();
app.use(express.json());
app.use('/api/mikrotik-users', mikrotikUserRoutes);

describe('Mikrotik User Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user123';
  const routerId = 'router123';
  const packageId = 'package123';

  it('GET /api/mikrotik-users/clients-for-sms should get clients for SMS', async () => {
    const res = await request(app).get('/api/mikrotik-users/clients-for-sms');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get Mikrotik clients for SMS' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMikrotikClientsForSms).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/delayed-payments should get delayed payments', async () => {
    const res = await request(app).get('/api/mikrotik-users/delayed-payments');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get delayed payments' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getDelayedPayments).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/stats/monthly-new-subscribers should get monthly new subscribers', async () => {
    const res = await request(app).get('/api/mikrotik-users/stats/monthly-new-subscribers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get monthly new subscribers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMonthlyNewSubscribers).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/stats/monthly-paid-subscribers should get monthly paid subscribers', async () => {
    const res = await request(app).get('/api/mikrotik-users/stats/monthly-paid-subscribers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get monthly paid subscribers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMonthlyPaidSubscribers).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/stats/monthly-total-subscribers/:year should get monthly total subscribers', async () => {
    const res = await request(app).get('/api/mikrotik-users/stats/monthly-total-subscribers/2023');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get monthly total subscribers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMonthlyTotalSubscribers).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users should get all Mikrotik users', async () => {
    const res = await request(app).get('/api/mikrotik-users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all Mikrotik users' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMikrotikUsers).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-users should create a new Mikrotik user', async () => {
    const res = await request(app).post('/api/mikrotik-users').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Mikrotik user created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.createMikrotikUser).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/:id/status should get Mikrotik user status', async () => {
    const res = await request(app).get(`/api/mikrotik-users/${userId}/status`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get status for user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMikrotikUserStatus).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/:id/traffic should get Mikrotik user traffic', async () => {
    const res = await request(app).get(`/api/mikrotik-users/${userId}/traffic`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get traffic for user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMikrotikUserTraffic).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/:userId/downtime-logs should get downtime logs for user', async () => {
    const res = await request(app).get(`/api/mikrotik-users/${userId}/downtime-logs`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get downtime logs for user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getDowntimeLogs).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/:id/payment-stats should get payment stats for user', async () => {
    const res = await request(app).get(`/api/mikrotik-users/${userId}/payment-stats`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get payment stats for user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getUserPaymentStats).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-users/:id/disconnect should disconnect user', async () => {
    const res = await request(app).post(`/api/mikrotik-users/${userId}/disconnect`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `User ${userId} disconnected` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.manualDisconnectUser).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-users/:id/connect should connect user', async () => {
    const res = await request(app).post(`/api/mikrotik-users/${userId}/connect`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `User ${userId} connected` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.manualConnectUser).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-users/:id should get a Mikrotik user by ID', async () => {
    const res = await request(app).get(`/api/mikrotik-users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get Mikrotik user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.getMikrotikUserById).toHaveBeenCalled();
  });

  it('PUT /api/mikrotik-users/:id should update a Mikrotik user by ID', async () => {
    const res = await request(app).put(`/api/mikrotik-users/${userId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update Mikrotik user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.updateMikrotikUser).toHaveBeenCalled();
  });

  it('DELETE /api/mikrotik-users/:id should delete a Mikrotik user by ID', async () => {
    const res = await request(app).delete(`/api/mikrotik-users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete Mikrotik user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(mikrotikUserController.deleteMikrotikUser).toHaveBeenCalled();
  });
});
