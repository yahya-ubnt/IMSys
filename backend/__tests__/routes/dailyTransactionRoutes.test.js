
const request = require('supertest');
const express = require('express');
const dailyTransactionRoutes = require('../../routes/dailyTransactionRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const dailyTransactionController = require('../../controllers/dailyTransactionController');
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
jest.mock('../../controllers/dailyTransactionController', () => ({
  createDailyTransaction: jest.fn((req, res) => res.status(201).json({ message: 'Daily transaction created' })),
  getDailyTransactions: jest.fn((req, res) => res.status(200).json({ message: 'Get all daily transactions' })),
  getDailyTransactionById: jest.fn((req, res) => res.status(200).json({ message: `Get daily transaction ${req.params.id}` })),
  updateDailyTransaction: jest.fn((req, res) => res.status(200).json({ message: `Update daily transaction ${req.params.id}` })),
  deleteDailyTransaction: jest.fn((req, res) => res.status(200).json({ message: `Delete daily transaction ${req.params.id}` })),
  getDailyTransactionStats: jest.fn((req, res) => res.status(200).json({ message: 'Get daily transaction stats' })),
  getMonthlyTransactionTotals: jest.fn((req, res) => res.status(200).json({ message: 'Get monthly transaction totals' })),
  getDailyCollectionTotals: jest.fn((req, res) => res.status(200).json({ message: 'Get daily collection totals' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
  const mockChainable = {
    isNumeric: jest.fn().mockReturnThis(),
    isIn: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    isEmpty: jest.fn().mockReturnThis(),
  };

  // The actual middleware function that express-validator chains resolve to
  const mockMiddleware = (req, res, next) => next();
  Object.assign(mockMiddleware, mockChainable); // Attach chainable methods to the middleware function

  return {
    body: jest.fn(() => mockMiddleware),
    validationResult: jest.fn(() => ({
      isEmpty: () => true, // Always pass validation
    })),
  };
});

const app = express();
app.use(express.json());
app.use('/api/daily-transactions', dailyTransactionRoutes);

describe('Daily Transaction Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/daily-transactions/stats should get daily transaction statistics', async () => {
    const res = await request(app).get('/api/daily-transactions/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get daily transaction stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.getDailyTransactionStats).toHaveBeenCalled();
  });

  it('GET /api/daily-transactions/monthly-totals should get monthly transaction totals', async () => {
    const res = await request(app).get('/api/daily-transactions/monthly-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get monthly transaction totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.getMonthlyTransactionTotals).toHaveBeenCalled();
  });

  it('GET /api/daily-transactions/daily-collection-totals should get daily collection totals', async () => {
    const res = await request(app).get('/api/daily-transactions/daily-collection-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get daily collection totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.getDailyCollectionTotals).toHaveBeenCalled();
  });

  it('POST /api/daily-transactions should create a new daily transaction', async () => {
    const res = await request(app).post('/api/daily-transactions').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Daily transaction created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.createDailyTransaction).toHaveBeenCalled();
  });

  it('GET /api/daily-transactions should get all daily transactions', async () => {
    const res = await request(app).get('/api/daily-transactions');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all daily transactions' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.getDailyTransactions).toHaveBeenCalled();
  });

  it('GET /api/daily-transactions/:id should get a daily transaction by ID', async () => {
    const transactionId = 'trans123';
    const res = await request(app).get(`/api/daily-transactions/${transactionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get daily transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.getDailyTransactionById).toHaveBeenCalled();
  });

  it('PUT /api/daily-transactions/:id should update a daily transaction by ID', async () => {
    const transactionId = 'trans123';
    const res = await request(app).put(`/api/daily-transactions/${transactionId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update daily transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.updateDailyTransaction).toHaveBeenCalled();
  });

  it('DELETE /api/daily-transactions/:id should delete a daily transaction by ID', async () => {
    const transactionId = 'trans123';
    const res = await request(app).delete(`/api/daily-transactions/${transactionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete daily transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dailyTransactionController.deleteDailyTransaction).toHaveBeenCalled();
  });
});
