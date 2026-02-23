
const request = require('supertest');
const express = require('express');
const expenseTypeRoutes = require('../../routes/expenseTypeRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const expenseTypeController = require('../../controllers/expenseTypeController');
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
jest.mock('../../controllers/expenseTypeController', () => ({
  createExpenseType: jest.fn((req, res) => res.status(201).json({ message: 'Expense type created' })),
  getExpenseTypes: jest.fn((req, res) => res.status(200).json({ message: 'Get all expense types' })),
  getExpenseTypeById: jest.fn((req, res) => res.status(200).json({ message: `Get expense type ${req.params.id}` })),
  updateExpenseType: jest.fn((req, res) => res.status(200).json({ message: `Update expense type ${req.params.id}` })),
  deleteExpenseType: jest.fn((req, res) => res.status(200).json({ message: `Delete expense type ${req.params.id}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      isString: jest.fn().mockReturnThis(),
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
app.use('/api/expense-types', expenseTypeRoutes);

describe('Expense Type Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/expense-types should create a new expense type', async () => {
    const res = await request(app).post('/api/expense-types').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Expense type created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseTypeController.createExpenseType).toHaveBeenCalled();
  });

  it('GET /api/expense-types should get all expense types', async () => {
    const res = await request(app).get('/api/expense-types');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all expense types' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseTypeController.getExpenseTypes).toHaveBeenCalled();
  });

  it('GET /api/expense-types/:id should get an expense type by ID', async () => {
    const expenseTypeId = 'expenseType123';
    const res = await request(app).get(`/api/expense-types/${expenseTypeId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get expense type ${expenseTypeId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseTypeController.getExpenseTypeById).toHaveBeenCalled();
  });

  it('PUT /api/expense-types/:id should update an expense type by ID', async () => {
    const expenseTypeId = 'expenseType123';
    const res = await request(app).put(`/api/expense-types/${expenseTypeId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update expense type ${expenseTypeId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseTypeController.updateExpenseType).toHaveBeenCalled();
  });

  it('DELETE /api/expense-types/:id should delete an expense type by ID', async () => {
    const expenseTypeId = 'expenseType123';
    const res = await request(app).delete(`/api/expense-types/${expenseTypeId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete expense type ${expenseTypeId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(expenseTypeController.deleteExpenseType).toHaveBeenCalled();
  });
});
