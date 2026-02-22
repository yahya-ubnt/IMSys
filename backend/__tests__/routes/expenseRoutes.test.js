
const request = require('supertest');
const express = require('express');
const expenseRoutes = require('../../routes/expenseRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const expenseController = require('../../controllers/expenseController');
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
jest.mock('../../controllers/expenseController', () => ({
  createExpense: jest.fn((req, res) => res.status(201).json({ message: 'Expense created' })),
  getExpenses: jest.fn((req, res) => res.status(200).json({ message: 'Get all expenses' })),
  getExpenseById: jest.fn((req, res) => res.status(200).json({ message: `Get expense ${req.params.id}` })),
  updateExpense: jest.fn((req, res) => res.status(200).json({ message: `Update expense ${req.params.id}` })),
  deleteExpense: jest.fn((req, res) => res.status(200).json({ message: `Delete expense ${req.params.id}` })),
  getExpenseStats: jest.fn((req, res) => res.status(200).json({ message: 'Get expense stats' })),
  getMonthlyExpenseTotal: jest.fn((req, res) => res.status(200).json({ message: 'Get monthly expense total' })),
  getYearlyMonthlyExpenseTotals: jest.fn((req, res) => res.status(200).json({ message: 'Get yearly monthly expense totals' })),
  getDailyExpenseTotals: jest.fn((req, res) => res.status(200).json({ message: 'Get daily expense totals' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      isISO8601: jest.fn().mockReturnThis(),
      toDate: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isFloat: jest.fn().mockReturnThis(),
      // Add other methods as needed
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
app.use('/api/expenses', expenseRoutes);

describe('Expense Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/expenses/stats should get expense statistics', async () => {
    const res = await request(app).get('/api/expenses/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get expense stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.getExpenseStats).toHaveBeenCalled();
  });

  it('GET /api/expenses/monthly-total should get monthly expense total', async () => {
    const res = await request(app).get('/api/expenses/monthly-total');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get monthly expense total' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.getMonthlyExpenseTotal).toHaveBeenCalled();
  });

  it('GET /api/expenses/yearly-monthly-totals should get yearly monthly expense totals', async () => {
    const res = await request(app).get('/api/expenses/yearly-monthly-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get yearly monthly expense totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.getYearlyMonthlyExpenseTotals).toHaveBeenCalled();
  });

  it('GET /api/expenses/daily-expense-totals should get daily expense totals', async () => {
    const res = await request(app).get('/api/expenses/daily-expense-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get daily expense totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.getDailyExpenseTotals).toHaveBeenCalled();
  });

  it('POST /api/expenses should create a new expense', async () => {
    const res = await request(app).post('/api/expenses').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Expense created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.createExpense).toHaveBeenCalled();
  });

  it('GET /api/expenses should get all expenses', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all expenses' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.getExpenses).toHaveBeenCalled();
  });

  it('GET /api/expenses/:id should get an expense by ID', async () => {
    const expenseId = 'expense123';
    const res = await request(app).get(`/api/expenses/${expenseId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get expense ${expenseId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.getExpenseById).toHaveBeenCalled();
  });

  it('PUT /api/expenses/:id should update an expense by ID', async () => {
    const expenseId = 'expense123';
    const res = await request(app).put(`/api/expenses/${expenseId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update expense ${expenseId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.updateExpense).toHaveBeenCalled();
  });

  it('DELETE /api/expenses/:id should delete an expense by ID', async () => {
    const expenseId = 'expense123';
    const res = await request(app).delete(`/api/expenses/${expenseId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete expense ${expenseId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseController.deleteExpense).toHaveBeenCalled();
  });
});
