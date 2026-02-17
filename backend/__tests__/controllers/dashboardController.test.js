const {
  getCollectionsSummary,
  getMonthlyCollectionsAndExpenses,
  getMonthlyExpenseSummary,
  getNewSubscriptionsCount,
  getTotalUsersCount,
  getActiveUsersCount,
  getExpiredUsersCount,
  getExpensesSummary,
  getDailyCollectionsAndExpenses,
} = require('../../controllers/dashboardController');
const Transaction = require('../../models/Transaction');
const Expense = require('../../models/Expense');
const MikrotikUser = require('../../models/MikrotikUser');
const { validationResult } = require('express-validator');

jest.mock('../../models/Transaction');
jest.mock('../../models/Expense');
jest.mock('../../models/MikrotikUser');
jest.mock('express-validator');

describe('dashboardController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'tenant-1' },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCollectionsSummary', () => {
    it('should return collection summaries', async () => {
      Transaction.aggregate.mockResolvedValue([{ totalAmount: 100 }]);
      await getCollectionsSummary(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        today: 100,
        weekly: 100,
        monthly: 100,
        yearly: 100,
      });
    });
  });

  describe('getMonthlyCollectionsAndExpenses', () => {
    it('should return monthly collections and expenses for a year', async () => {
      req.query.year = '2023';
      Transaction.aggregate.mockResolvedValue([{ month: 1, amount: 1000 }]);
      Expense.aggregate.mockResolvedValue([{ month: 1, amount: 500 }]);
      await getMonthlyCollectionsAndExpenses(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getNewSubscriptionsCount', () => {
    it('should return the count of new subscriptions this month', async () => {
      MikrotikUser.countDocuments.mockResolvedValue(5);
      await getNewSubscriptionsCount(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ newSubscriptions: 5 });
    });
  });

  describe('getTotalUsersCount', () => {
    it('should return the total number of users', async () => {
      MikrotikUser.countDocuments.mockResolvedValue(150);
      await getTotalUsersCount(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ totalUsers: 150 });
    });
  });

  describe('getActiveUsersCount', () => {
    it('should return the number of active users', async () => {
      MikrotikUser.countDocuments.mockResolvedValue(120);
      await getActiveUsersCount(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ activeUsers: 120 });
    });
  });

  describe('getExpiredUsersCount', () => {
    it('should return the number of expired users', async () => {
      MikrotikUser.countDocuments.mockResolvedValue(30);
      await getExpiredUsersCount(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ expiredUsers: 30 });
    });
  });
});
