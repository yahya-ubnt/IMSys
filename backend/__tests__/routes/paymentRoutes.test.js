
const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../../routes/paymentRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const paymentController = require('../../controllers/paymentController');
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
jest.mock('../../controllers/paymentController', () => ({
  handleDarajaCallback: jest.fn((req, res) => res.status(200).json({ message: 'Daraja callback handled' })),
  initiateStkPush: jest.fn((req, res) => res.status(200).json({ message: 'STK push initiated' })),
  getTransactions: jest.fn((req, res) => res.status(200).json({ message: 'Get all transactions' })),
  createCashPayment: jest.fn((req, res) => res.status(201).json({ message: 'Cash payment created' })),
  getWalletTransactions: jest.fn((req, res) => res.status(200).json({ message: 'Get all wallet transactions' })),
  getWalletTransactionById: jest.fn((req, res) => res.status(200).json({ message: `Get wallet transaction ${req.params.id}` })),
  createWalletTransaction: jest.fn((req, res) => res.status(201).json({ message: 'Wallet transaction created' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      isNumeric: jest.fn().mockReturnThis(),
      isMobilePhone: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isIn: jest.fn().mockReturnThis(),
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
app.use('/api/payments', paymentRoutes);

describe('Payment Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user123';
  const transactionId = 'trans123';

  it('POST /api/payments/initiate-stk should initiate an STK push', async () => {
    const res = await request(app).post('/api/payments/initiate-stk').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'STK push initiated' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.initiateStkPush).toHaveBeenCalled();
  });

  it('POST /api/payments/cash should create a cash payment', async () => {
    const res = await request(app).post('/api/payments/cash').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Cash payment created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.createCashPayment).toHaveBeenCalled();
  });

  it('GET /api/payments/transactions should get all transactions', async () => {
    const res = await request(app).get('/api/payments/transactions');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all transactions' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.getTransactions).toHaveBeenCalled();
  });

  it('GET /api/payments/wallet should get all wallet transactions', async () => {
    const res = await request(app).get('/api/payments/wallet');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all wallet transactions' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.getWalletTransactions).toHaveBeenCalled();
  });

  it('GET /api/payments/wallet/user/:id should get wallet transactions for a specific user', async () => {
    const res = await request(app).get(`/api/payments/wallet/user/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all wallet transactions' }); // Controller returns all, not user specific
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.getWalletTransactions).toHaveBeenCalled();
  });

  it('POST /api/payments/wallet should create a wallet transaction', async () => {
    const res = await request(app).post('/api/payments/wallet').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Wallet transaction created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.createWalletTransaction).toHaveBeenCalled();
  });

  it('GET /api/payments/wallet/:id should get a wallet transaction by ID', async () => {
    const res = await request(app).get(`/api/payments/wallet/${transactionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get wallet transaction ${transactionId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(paymentController.getWalletTransactionById).toHaveBeenCalled();
  });
});
