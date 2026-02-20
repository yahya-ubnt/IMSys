const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getMonthlyTransactionTotals,
} = require('../../controllers/transactionController');
const Transaction = require('../../models/Transaction');
const { validationResult } = require('express-validator');

jest.mock('../../models/Transaction', () => {
  const mockTransactionInstance = {
    save: jest.fn(),
    deleteOne: jest.fn(),
  };
  const mockTransaction = jest.fn(function(data) {
    Object.assign(this, data);
    this.save = mockTransactionInstance.save;
    this.deleteOne = mockTransactionInstance.deleteOne;
  });
  mockTransaction.findOne = jest.fn(() => mockTransactionInstance);
  mockTransaction.find = jest.fn(() => [mockTransactionInstance]);
  mockTransaction.aggregate = jest.fn(() => [mockTransactionInstance]);
  mockTransaction.countDocuments = jest.fn(() => 1);
  return mockTransaction;
});
jest.mock('express-validator');

describe('Transaction Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
      user: { tenant: 'testTenant' },
      body: {},
      query: { year: '2024' },
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

  describe('createTransaction', () => {
    it('should create a new transaction', async () => {
      const transactionData = { amount: 100 };
      const mockTransactionInstance = { ...transactionData, save: jest.fn().mockResolvedValue(transactionData) };
      Transaction.mockImplementation(() => mockTransactionInstance);
      req.body = transactionData;
      await createTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(transactionData);
    });
  });

  describe('getTransactions', () => {
    it('should return a list of transactions', async () => {
      const mockTransactions = [{ _id: 't1' }];
      Transaction.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockTransactions) });
      await getTransactions(req, res);
      expect(res.json).toHaveBeenCalledWith(mockTransactions);
    });
  });

  describe('getTransactionById', () => {
    it('should return a single transaction', async () => {
      const mockTransaction = { _id: 't1' };
      Transaction.findOne.mockResolvedValue(mockTransaction);
      await getTransactionById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction', async () => {
      const transactionData = { amount: 200 };
      const mockTransaction = { _id: 't1', save: jest.fn().mockResolvedValue(transactionData) };
      req.body = transactionData;
      Transaction.findOne.mockResolvedValue(mockTransaction);
      await updateTransaction(req, res, next);
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(transactionData);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction', async () => {
      const mockTransaction = { _id: 't1', deleteOne: jest.fn() };
      Transaction.findOne.mockResolvedValue(mockTransaction);
      await deleteTransaction(req, res, next);
      expect(mockTransaction.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Daily transaction removed' });
    });
  });

  describe('getTransactionStats', () => {
    it('should return transaction stats', async () => {
      Transaction.aggregate.mockResolvedValue([{ total: 100 }]);
      await getTransactionStats(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getMonthlyTransactionTotals', () => {
    it('should return monthly transaction totals', async () => {
      const mockMonthlyTotals = [{ _id: { month: 1 }, total: 1000 }];
      Transaction.aggregate.mockResolvedValue(mockMonthlyTotals);
      await getMonthlyTransactionTotals(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
