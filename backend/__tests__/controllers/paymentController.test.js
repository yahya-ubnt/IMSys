const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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
const Tenant = require('../../models/Tenant');
const Package = require('../../models/Package');
const MikrotikRouter = require('../../models/MikrotikRouter');
const mpesaService = require('../../services/mpesaService');
const { validationResult } = require('express-validator');

// Mock external services
jest.mock('../../services/mpesaService');
jest.mock('../../services/smsService');
jest.mock('../../queues/mikrotikSyncQueue', () => ({
  add: jest.fn(),
}));

let mongoServer;

beforeAll(async () => {
  // Use a Replica Set to support Transactions
  mongoServer = await MongoMemoryServer.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Payment Controller (Integration)', () => {
  let req, res, next, tenant, router, pkg, user;

  beforeEach(async () => {
    await Transaction.deleteMany({});
    await WalletTransaction.deleteMany({});
    await MikrotikUser.deleteMany({});
    await Tenant.deleteMany({});
    await Package.deleteMany({});
    await MikrotikRouter.deleteMany({});

    tenant = await Tenant.create({ name: 'Finance Tenant' });
    router = await MikrotikRouter.create({
        name: 'Test Router',
        ipAddress: '192.168.88.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        tenant: tenant._id
    });
    pkg = await Package.create({
        name: 'Basic',
        price: 1000,
        duration: 30,
        profile: 'basic_profile',
        serviceType: 'pppoe',
        mikrotikRouter: router._id,
        tenant: tenant._id
    });
    user = await MikrotikUser.create({
        officialName: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        phone: '254700000000',
        mPesaRefNo: '123456',
        serviceType: 'pppoe',
        package: pkg._id,
        mikrotikRouter: router._id,
        tenant: tenant._id,
        walletBalance: 0,
        billingCycle: 'Monthly',
        mobileNumber: '254700000000',
        expiryDate: new Date(Date.now() + 86400000) // Expires in 1 day
    });

    req = {
      params: {},
      user: { tenant: tenant._id, _id: 'admin123' },
      body: {},
      query: {},
      ip: '196.201.214.200', // Valid Safaricom IP
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('createCashPayment', () => {
    it('should process a cash payment and update user wallet', async () => {
      req.body = {
        userId: user._id.toString(),
        amount: '1000',
        comment: 'Manual cash payment'
      };

      await createCashPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      
      // Verify Database state
      const updatedUser = await MikrotikUser.findById(user._id);
      // Logic: 1000 paid, pkg is 1000. Balance should be 0 (if it was 0)
      // Actually processSubscriptionPayment logic:
      // If amount >= package.price, it renews and subtracts price.
      expect(updatedUser.walletBalance).toBe(0);

      const transaction = await Transaction.findOne({ mikrotikUser: user._id });
      expect(transaction.amount).toBe(1000);
      expect(transaction.paymentMethod).toBe('Cash');
    });

    it('should handle payment for user identified by M-Pesa ref', async () => {
        // We use PaymentService.handleSuccessfulPayment which supports reference as user._id or mPesaRefNo
        // In the controller, it passes userId as reference
        req.body = {
            userId: '123456', // The mPesaRefNo
            amount: '500',
            comment: 'Partial payment'
        };

        await createCashPayment(req, res, next);

        const updatedUser = await MikrotikUser.findById(user._id);
        // Balance was 0. 500 paid. Package is 1000. 
        // processSubscriptionPayment: If amount < price, it just adds to wallet balance.
        expect(updatedUser.walletBalance).toBe(500);
    });
  });

  describe('handleDarajaCallback', () => {
    it('should process STK push success callback', async () => {
      req.body = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'req123',
            CheckoutRequestID: 'check123',
            ResultCode: 0,
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 1000 },
                { Name: 'MpesaReceiptNumber', Value: 'QKJ123456' },
                { Name: 'PhoneNumber', Value: 254700000000 }
              ]
            }
          }
        }
      };

      // Mock the helper that extracts data from the body
      const mpesaServiceActual = jest.requireActual('../../services/mpesaService');
      mpesaService.processStkCallback.mockImplementation(async (data) => {
          // This mimics the actual mpesaService.processStkCallback logic
          const amount = data.CallbackMetadata.Item.find(i => i.Name === 'Amount').Value;
          const trId = data.CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber').Value;
          const phone = data.CallbackMetadata.Item.find(i => i.Name === 'PhoneNumber').Value;
          
          const PaymentService = require('../../services/paymentService');
          await PaymentService.handleSuccessfulPayment({
              tenant: tenant._id,
              amount,
              transactionId: trId,
              reference: '123456', // Ref matches our user's mPesaRefNo
              paymentMethod: 'M-Pesa STK',
              msisdn: phone.toString()
          });
      });

      await handleDarajaCallback(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedUser = await MikrotikUser.findById(user._id);
      expect(updatedUser.walletBalance).toBe(0); // Paid 1000 for 1000 pkg
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      await Transaction.create({
        transactionId: 'TX1',
        amount: 100,
        referenceNumber: 'REF1',
        officialName: 'Test',
        paymentMethod: 'Cash',
        tenant: tenant._id,
        mikrotikUser: user._id,
        transactionDate: new Date()
      });

      await getTransactions(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        count: 1,
        transactions: expect.arrayContaining([
            expect.objectContaining({ transactionId: 'TX1' })
        ])
      }));
    });
  });

  describe('getWalletTransactions', () => {
    it('should return wallet transactions for a user', async () => {
        await WalletTransaction.create({
            mikrotikUser: user._id,
            tenant: tenant._id,
            amount: 100,
            type: 'Credit',
            source: 'Cash',
            transactionId: 'W1',
            balanceBefore: 0,
            balanceAfter: 100
        });

        req.params.userId = user._id.toString();
        await getWalletTransactions(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            count: 1,
            transactions: expect.arrayContaining([
                expect.objectContaining({ transactionId: 'W1' })
            ])
        }));
    });
  });
});
