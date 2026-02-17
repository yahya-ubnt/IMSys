const {
  createDailyTransaction,
  getDailyTransactions,
  getDailyTransactionById,
  updateDailyTransaction,
  deleteDailyTransaction,
  getDailyTransactionStats,
  getMonthlyTransactionTotals,
  getDailyCollectionTotals,
} = require('../../controllers/dailyTransactionController');
const DailyTransaction = require('../../models/DailyTransaction');
const { validationResult } = require('express-validator');
const moment = require('moment-timezone');

jest.mock('../../models/DailyTransaction');
jest.mock('express-validator');
jest.mock('moment-timezone');

describe('dailyTransactionController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'tenant-1' },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    
    const mockMoment = {
        startOf: jest.fn().mockReturnThis(),
        toDate: jest.fn().mockReturnValue(new Date('2023-01-15')),
        date: jest.fn().mockReturnValue(31),
        endOf: jest.fn().mockReturnThis(),
      };
      moment.mockReturnValue(mockMoment);
      moment.tz = {
        setDefault: jest.fn(),
      };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDailyTransaction', () => {
    it('should create a daily transaction successfully', async () => {
      req.body = { amount: 100, method: 'Cash' };
      const mockTransaction = { ...req.body, save: jest.fn().mockResolvedValue(req.body) };
      DailyTransaction.prototype.save.mockResolvedValue(mockTransaction);


      await createDailyTransaction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('getDailyTransactions', () => {
    it('should get all daily transactions', async () => {
      const mockTransactions = [{ amount: 100 }, { amount: 200 }];
      DailyTransaction.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockTransactions),
      });
      DailyTransaction.countDocuments.mockResolvedValue(2);

      await getDailyTransactions(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        transactions: mockTransactions,
      }));
    });
  });

  describe('getDailyTransactionById', () => {
    it('should get a single daily transaction by ID', async () => {
      req.params.id = 'tx-1';
      const mockTransaction = { _id: 'tx-1', amount: 100 };
      DailyTransaction.findOne.mockResolvedValue(mockTransaction);

      await getDailyTransactionById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('updateDailyTransaction', () => {
    it('should update a daily transaction successfully', async () => {
      req.params.id = 'tx-1';
      req.body = { amount: 150 };
      const mockTransaction = { 
        _id: 'tx-1', 
        amount: 100,
        save: jest.fn().mockResolvedValue({ _id: 'tx-1', amount: 150 })
      };
      DailyTransaction.findOne.mockResolvedValue(mockTransaction);

      await updateDailyTransaction(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ amount: 150 }));
    });
  });

  describe('deleteDailyTransaction', () => {
    it('should delete a daily transaction successfully', async () => {
      req.params.id = 'tx-1';
      const mockTransaction = { 
        _id: 'tx-1', 
        deleteOne: jest.fn().mockResolvedValue(true)
      };
      DailyTransaction.findOne.mockResolvedValue(mockTransaction);

      await deleteDailyTransaction(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Daily transaction removed' });
    });
  });

  describe('getDailyTransactionStats', () => {
    it('should return daily transaction stats', async () => {
        const mockStats = [{
            today: [{ _id: 'Personal', total: 50 }],
            thisWeek: [{ _id: 'Company', total: 300 }],
            thisMonth: [],
            thisYear: [],
          }];
        DailyTransaction.aggregate.mockResolvedValue(mockStats);
    
        await getDailyTransactionStats(req, res, next);
    
        expect(res.json).toHaveBeenCalledWith({
          today: { personal: 50, company: 0, total: 50 },
          thisWeek: { personal: 0, company: 300, total: 300 },
          thisMonth: { personal: 0, company: 0, total: 0 },
          thisYear: { personal: 0, company: 0, total: 0 },
        });
      });
  });
});
