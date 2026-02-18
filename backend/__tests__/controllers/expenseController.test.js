const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getMonthlyExpenseTotal,
  getYearlyMonthlyExpenseTotals,
  getDailyExpenseTotals,
  getExpenseStats,
} = require('../../controllers/expenseController');
const Expense = require('../../models/Expense');
const { validationResult } = require('express-validator');

jest.mock('../../models/Expense');
jest.mock('express-validator');

describe('Expense Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testExpense' },
      user: { _id: 'testUser', tenant: 'testTenant' },
      body: {},
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

  describe('createExpense', () => {
    it('should create an expense', async () => {
      const expenseData = { title: 'Test Expense', amount: 100, expenseType: 'testType', description: 'Test Desc', expenseDate: new Date() };
      req.body = expenseData;
      Expense.create.mockResolvedValue(expenseData);

      await createExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expenseData);
    });

    it('should return 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });

      await createExpense(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });
  });

  describe('getExpenses', () => {
    it('should return all expenses for a tenant', async () => {
      const expenses = [{ title: 'Expense 1' }, { title: 'Expense 2' }];
      const finalQuery = { populate: jest.fn().mockResolvedValue(expenses) };
      const initialQuery = { populate: jest.fn().mockReturnValue(finalQuery) };
      Expense.find.mockReturnValue(initialQuery);

      await getExpenses(req, res);

      expect(Expense.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expenses);
    });
  });

  describe('getExpenseById', () => {
    it('should return a single expense', async () => {
        const expense = { title: 'Test Expense' };
        const finalQuery = { populate: jest.fn().mockResolvedValue(expense) };
        const initialQuery = { populate: jest.fn().mockReturnValue(finalQuery) };
        Expense.findOne.mockReturnValue(initialQuery);
  
        await getExpenseById(req, res);
  
        expect(Expense.findOne).toHaveBeenCalledWith({ _id: 'testExpense', tenant: 'testTenant' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expense);
      });
  
      it('should return 404 if expense not found', async () => {
        const finalQuery = { populate: jest.fn().mockResolvedValue(null) };
        const initialQuery = { populate: jest.fn().mockReturnValue(finalQuery) };
        Expense.findOne.mockReturnValue(initialQuery);
  
        await getExpenseById(req, res, next);
  
        expect(next).toHaveBeenCalledWith(new Error('Expense not found'));
      });
  });

  describe('updateExpense', () => {
    it('should update an expense', async () => {
        const mockExpense = {
            title: 'Old Title',
            amount: 100,
            save: jest.fn().mockResolvedValue({ title: 'New Title', amount: 150 }),
          };
          Expense.findOne.mockResolvedValue(mockExpense);
          req.body = { title: 'New Title', amount: 150 };
      
          await updateExpense(req, res);
      
          expect(mockExpense.title).toBe('New Title');
          expect(mockExpense.amount).toBe(150);
          expect(mockExpense.save).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({ title: 'New Title', amount: 150 });
    });

    it('should return 404 if expense not found', async () => {
        Expense.findOne.mockResolvedValue(null);
    
        await updateExpense(req, res, next);
    
        expect(next).toHaveBeenCalledWith(new Error('Expense not found'));
      });
  });

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
        const mockExpense = {
            deleteOne: jest.fn().mockResolvedValue({}),
          };
          Expense.findOne.mockResolvedValue(mockExpense);
      
          await deleteExpense(req, res);
      
          expect(mockExpense.deleteOne).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({ message: 'Expense removed' });
    });

    it('should return 404 if expense not found', async () => {
        Expense.findOne.mockResolvedValue(null);
    
        await deleteExpense(req, res, next);
    
        expect(next).toHaveBeenCalledWith(new Error('Expense not found'));
      });
  });

  describe('getMonthlyExpenseTotal', () => {
    it('should return the total expenses for the current month', async () => {
      Expense.aggregate.mockResolvedValue([{ total: 500 }]);

      await getMonthlyExpenseTotal(req, res);

      expect(res.json).toHaveBeenCalledWith({ total: 500 });
    });
  });

  describe('getYearlyMonthlyExpenseTotals', () => {
    it('should return monthly expense totals for a given year', async () => {
      req.query.year = '2024';
      Expense.aggregate.mockResolvedValue([{ _id: { month: 1 }, total: 100 }]);

      await getYearlyMonthlyExpenseTotals(req, res);

      const expected = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
      expected[0].total = 100;

      expect(res.json).toHaveBeenCalledWith(expected);
    });
  });

  describe('getDailyExpenseTotals', () => {
    it('should return daily expense totals for a given month and year', async () => {
      req.query.year = '2024';
      req.query.month = '2'; // February
      Expense.aggregate.mockResolvedValue([{ _id: { day: 1 }, total: 50 }]);

      await getDailyExpenseTotals(req, res);

      // Assuming Feb 2024 has 29 days
      const expected = Array.from({ length: 29 }, (_, i) => ({ day: i + 1, total: 0 }));
      expected[0].total = 50;

      expect(res.json).toHaveBeenCalledWith(expected);
    });
  });

  describe('getExpenseStats', () => {
    it('should return expense stats for today, week, month, and year', async () => {
      Expense.aggregate.mockResolvedValueOnce([{ total: 10 }]) // today
                       .mockResolvedValueOnce([{ total: 70 }]) // week
                       .mockResolvedValueOnce([{ total: 300 }]) // month
                       .mockResolvedValueOnce([{ total: 3650 }]); // year

      await getExpenseStats(req, res);

      expect(res.json).toHaveBeenCalledWith({ today: 10, week: 70, month: 300, year: 3650 });
    });
  });
});