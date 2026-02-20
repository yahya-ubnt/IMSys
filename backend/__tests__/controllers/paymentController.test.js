const {
  initiateStkPush,
  handleDarajaCallback,
  getTransactions,
  createCashPayment,
  getWalletTransactions,
  getWalletTransactionById,
  createWalletTransaction,
} = require('../../controllers/paymentController');
const Transaction = require('../../models/Transaction');
const WalletTransaction = require('../../models/WalletTransaction');
const MikrotikUser = require('../../models/MikrotikUser');
const PaymentService = require('../../services/paymentService');
const mpesaService = require('../../services/mpesaService');
const { validationResult } = require('express-validator');
const { randomUUID } = require('crypto');

jest.mock('../../models/Transaction');
jest.mock('../../models/WalletTransaction');
jest.mock('../../models/MikrotikUser');
jest.mock('../../services/paymentService');
jest.mock('../../services/mpesaService');
jest.mock('express-validator');
// const { MongoMemoryServer } = require('mongodb-memory-server'); // Removed
// const mongoose = require('mongoose'); // Moved to mock



// Mock the entire module for external dependencies
jest.mock('../../models/MikrotikUser');
jest.mock('../../services/userService');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../models/Package');
jest.mock('../../models/UserDowntimeLog');
jest.mock('../../models/Transaction');
jest.mock('../../utils/mikrotikUtils');
jest.mock('../../utils/crypto');
jest.mock('node-routeros');
jest.mock('express-validator');
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));
jest.mock('mongoose'); // Use the mock from __mocks__/mongoose.js
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

describe('Payment Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testTransactionId', userId: 'testUserId' },
      user: { tenant: 'testTenant', _id: 'testUserId' },
      body: {},
      query: {},
      ip: '196.201.214.200', // Mock a valid Safaricom IP
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

  describe('initiateStkPush', () => {
    it('should initiate STK push successfully', async () => {
      req.body = { amount: 100, phoneNumber: '254712345678', accountReference: 'REF123' };
      mpesaService.initiateStkPushService.mockResolvedValue({ success: true });

      await initiateStkPush(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(mpesaService.initiateStkPushService).toHaveBeenCalledWith('testTenant', 100, '254712345678', 'REF123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });

      await initiateStkPush(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });

    it('should return 500 if STK push initiation fails', async () => {
      req.body = { amount: 100, phoneNumber: '254712345678', accountReference: 'REF123' };
      mpesaService.initiateStkPushService.mockRejectedValue(new Error('Mpesa error'));

      await initiateStkPush(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to initiate STK push.' });
    });
  });

  describe('handleDarajaCallback', () => {
    it('should process STK callback successfully', async () => {
      req.body = { Body: { stkCallback: { CheckoutRequestID: 'req1', ResultCode: 0 } } };
      mpesaService.processStkCallback.mockResolvedValue(true);

      await handleDarajaCallback(req, res);

      expect(mpesaService.processStkCallback).toHaveBeenCalledWith({ CheckoutRequestID: 'req1', ResultCode: 0 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ "ResultCode": 0, "ResultDesc": "Accepted" });
    });

    it('should process C2B callback successfully', async () => {
      req.body = { TransID: 'trans1' };
      mpesaService.processC2bCallback.mockResolvedValue(true);

      await handleDarajaCallback(req, res);

      expect(mpesaService.processC2bCallback).toHaveBeenCalledWith({ TransID: 'trans1' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ "ResultCode": 0, "ResultDesc": "Accepted" });
    });

    it('should return 403 for untrusted IP', async () => {
      req.ip = '1.1.1.1'; // Untrusted IP

      await handleDarajaCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Untrusted source' });
    });

    it('should return 500 if callback processing fails', async () => {
      req.body = { Body: { stkCallback: { CheckoutRequestID: 'req1', ResultCode: 0 } } };
      mpesaService.processStkCallback.mockRejectedValue(new Error('Processing error'));

      await handleDarajaCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ "ResultCode": 1, "ResultDesc": "Internal Server Error" });
    });
  });

  describe('getTransactions', () => {
    it('should return transactions', async () => {
      const mockTransactions = { transactions: [{ _id: 't1' }], pages: 1 };
      PaymentService.getTransactions.mockResolvedValue(mockTransactions);

      await getTransactions(req, res);

      expect(PaymentService.getTransactions).toHaveBeenCalledWith('testTenant', req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTransactions);
    });
  });

  describe('getWalletTransactions', () => {
    it('should return wallet transactions', async () => {
      const mockWalletTransactions = { transactions: [{ _id: 'wt1' }], pages: 1 };
      PaymentService.getWalletTransactions.mockResolvedValue(mockWalletTransactions);

      await getWalletTransactions(req, res);

      expect(PaymentService.getWalletTransactions).toHaveBeenCalledWith('testTenant', { userId: 'testUserId' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWalletTransactions);
    });
  });

  describe('getWalletTransactionById', () => {
    it('should return a single wallet transaction by ID', async () => {
      const mockWalletTransaction = { _id: 'wt1' };
      PaymentService.getWalletTransactionById.mockResolvedValue(mockWalletTransaction);

      await getWalletTransactionById(req, res);

      expect(PaymentService.getWalletTransactionById).toHaveBeenCalledWith('testTransactionId', 'testTenant');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWalletTransaction);
    });
  });

  describe('createCashPayment', () => {
    it('should create a cash payment', async () => {
      req.body = { userId: 'user1', amount: 500, comment: 'Cash payment' };
      PaymentService.handleSuccessfulPayment.mockResolvedValue(true);

      await createCashPayment(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(randomUUID).toHaveBeenCalled();
      expect(PaymentService.handleSuccessfulPayment).toHaveBeenCalledWith(expect.objectContaining({
        tenant: 'testTenant',
        amount: 500,
        transactionId: 'CASH-mock-uuid',
        reference: 'user1',
        paymentMethod: 'Cash',
        comment: 'Cash payment',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, transactionId: 'CASH-mock-uuid' });
    });

    it('should return 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });

      await createCashPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });
  });

  describe('createWalletTransaction', () => {
    it('should create a wallet transaction', async () => {
      const transactionData = { amount: 100, type: 'Credit' };
      const createdTransaction = { _id: 'wt2', ...transactionData };
      req.body = transactionData;
      PaymentService.createWalletTransaction.mockResolvedValue(createdTransaction);

      await createWalletTransaction(req, res);

      expect(validationResult).toHaveBeenCalledWith(req);
      expect(PaymentService.createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({
        ...transactionData,
        tenant: 'testTenant',
      }), 'testUserId');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdTransaction);
    });

    it('should return 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });

      await createWalletTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });
  });
});