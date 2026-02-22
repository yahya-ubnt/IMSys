
const request = require('supertest');
const express = require('express');
const transactionRoutes = require('../../routes/transactionRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const transactionController = require('../../controllers/transactionController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/transactionController', () => ({
  createTransaction: jest.fn((req, res) => res.status(201).json({ message: 'Transaction created' })),
  getTransactions: jest.fn((req, res) => res.status(200).json({ message: 'Get all transactions' })),
  getTransactionById: jest.fn((req, res) => res.status(200).json({ message: `Get transaction ${req.params.id}` })),
  updateTransaction: jest.fn((req, res) => res.status(200).json({ message: `Update transaction ${req.params.id}` })),
  deleteTransaction: jest.fn((req, res) => res.status(200).json({ message: `Delete transaction ${req.params.id}` })),
  getTransactionStats: jest.fn((req, res) => res.status(200).json({ message: 'Transaction stats' })),
  getMonthlyTransactionTotals: jest.fn((req, res) => res.status(200).json({ message: 'Monthly transaction totals' })),
}));

const app = express();
app.use(express.json());
app.use('/api/transactions', transactionRoutes);

describe('Transaction Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const transactionId = 'trans123';

  it('POST /api/transactions should create a new transaction', async () => {
    const res = await request(app).post('/api/transactions').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Transaction created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.createTransaction).toHaveBeenCalled();
  });

  it('GET /api/transactions should get all transactions', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all transactions' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.getTransactions).toHaveBeenCalled();
  });

  it('GET /api/transactions/stats should get transaction statistics', async () => {
    const res = await request(app).get('/api/transactions/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Transaction stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.getTransactionStats).toHaveBeenCalled();
  });

  it('GET /api/transactions/monthly-totals should get monthly transaction totals', async () => {
    const res = await request(app).get('/api/transactions/monthly-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Monthly transaction totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.getMonthlyTransactionTotals).toHaveBeenCalled();
  });

  it('GET /api/transactions/:id should get a transaction by ID', async () => {
    const res = await request(app).get(`/api/transactions/${transactionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.getTransactionById).toHaveBeenCalled();
  });

  it('PUT /api/transactions/:id should update a transaction by ID', async () => {
    const res = await request(app).put(`/api/transactions/${transactionId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.updateTransaction).toHaveBeenCalled();
  });

  it('DELETE /api/transactions/:id should delete a transaction by ID', async () => {
    const res = await request(app).delete(`/api/transactions/${transactionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(transactionController.deleteTransaction).toHaveBeenCalled();
  });
});
