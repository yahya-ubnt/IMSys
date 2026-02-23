
const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../../routes/dashboardRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const dashboardController = require('../../controllers/dashboardController');
const { query } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/dashboardController', () => ({
  getCollectionsSummary: jest.fn((req, res) => res.status(200).json({ message: 'Collections summary' })),
  getMonthlyCollectionsAndExpenses: jest.fn((req, res) => res.status(200).json({ message: 'Monthly collections and expenses' })),
  getDailyCollectionsAndExpenses: jest.fn((req, res) => res.status(200).json({ message: 'Daily collections and expenses' })),
  getMonthlyExpenseSummary: jest.fn((req, res) => res.status(200).json({ message: 'Monthly expense summary' })),
  getNewSubscriptionsCount: jest.fn((req, res) => res.status(200).json({ message: 'New subscriptions count' })),
  getTotalUsersCount: jest.fn((req, res) => res.status(200).json({ message: 'Total users count' })),
  getActiveUsersCount: jest.fn((req, res) => res.status(200).json({ message: 'Active users count' })),
  getExpiredUsersCount: jest.fn((req, res) => res.status(200).json({ message: 'Expired users count' })),
  getExpensesSummary: jest.fn((req, res) => res.status(200).json({ message: 'Expenses summary' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      // Add other methods as needed
    };
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChainable);
  
    return {
      query: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/dashboard/collections/summary should get collections summary', async () => {
    const res = await request(app).get('/api/dashboard/collections/summary');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Collections summary' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getCollectionsSummary).toHaveBeenCalled();
  });

  it('GET /api/dashboard/collections-expenses/monthly should get monthly collections and expenses', async () => {
    const res = await request(app).get('/api/dashboard/collections-expenses/monthly?year=2023');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Monthly collections and expenses' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getMonthlyCollectionsAndExpenses).toHaveBeenCalled();
  });

  it('GET /api/dashboard/collections-expenses/daily should get daily collections and expenses', async () => {
    const res = await request(app).get('/api/dashboard/collections-expenses/daily?year=2023&month=1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Daily collections and expenses' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getDailyCollectionsAndExpenses).toHaveBeenCalled();
  });

  it('GET /api/dashboard/expenses/summary should get expenses summary', async () => {
    const res = await request(app).get('/api/dashboard/expenses/summary');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Expenses summary' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getExpensesSummary).toHaveBeenCalled();
  });

  it('GET /api/dashboard/expenses/monthly-summary should get monthly expense summary', async () => {
    const res = await request(app).get('/api/dashboard/expenses/monthly-summary');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Monthly expense summary' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getMonthlyExpenseSummary).toHaveBeenCalled();
  });

  it('GET /api/dashboard/subscriptions/new should get new subscriptions count', async () => {
    const res = await request(app).get('/api/dashboard/subscriptions/new');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'New subscriptions count' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getNewSubscriptionsCount).toHaveBeenCalled();
  });

  it('GET /api/dashboard/users/total should get total users count', async () => {
    const res = await request(app).get('/api/dashboard/users/total');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Total users count' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getTotalUsersCount).toHaveBeenCalled();
  });

  it('GET /api/dashboard/users/active should get active users count', async () => {
    const res = await request(app).get('/api/dashboard/users/active');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Active users count' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getActiveUsersCount).toHaveBeenCalled();
  });

  it('GET /api/dashboard/users/expired should get expired users count', async () => {
    const res = await request(app).get('/api/dashboard/users/expired');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Expired users count' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(dashboardController.getExpiredUsersCount).toHaveBeenCalled();
  });
});
