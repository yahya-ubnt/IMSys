const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../../controllers/transactionController');
const Transaction = require('../../models/Transaction');
const Tenant = require('../../models/Tenant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Transaction Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Transaction.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Tx Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      req.body = {
        amount: 100,
        paymentMethod: 'Cash',
        officialName: 'John Doe',
        referenceNumber: 'REF123',
        msisdn: '254700000000',
        transactionId: 'TX123'
      };

      await createTransaction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const tx = await Transaction.findOne({ transactionId: 'TX123' });
      expect(tx).toBeDefined();
      expect(tx.paymentMethod).toBe('Cash');
    });
  });

  describe('getTransactions', () => {
      it('should return all transactions for tenant', async () => {
          await Transaction.create({
              transactionId: 'TX456',
              amount: 50,
              paymentMethod: 'M-Pesa',
              referenceNumber: 'REF1',
              officialName: 'John',
              tenant: tenant._id,
              transactionDate: new Date(),
              msisdn: '123'
          });

          await getTransactions(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ transactionId: 'TX456' })
          ]));
      });
  });

  describe('updateTransaction', () => {
      it('should update a transaction successfully', async () => {
          const tx = await Transaction.create({
              transactionId: 'TX789',
              amount: 50,
              paymentMethod: 'M-Pesa',
              referenceNumber: 'REF1',
              officialName: 'John',
              tenant: tenant._id,
              transactionDate: new Date(),
              msisdn: '123'
          });

          req.params.id = tx._id;
          req.body = { officialName: 'Jane Doe' };

          await updateTransaction(req, res, next);
          const updated = await Transaction.findById(tx._id);
          expect(updated.officialName).toBe('Jane Doe');
      });
  });

  describe('deleteTransaction', () => {
      it('should delete a transaction successfully', async () => {
          const tx = await Transaction.create({
              transactionId: 'TX999',
              amount: 50,
              paymentMethod: 'M-Pesa',
              referenceNumber: 'REF1',
              officialName: 'John',
              tenant: tenant._id,
              transactionDate: new Date(),
              msisdn: '123'
          });

          req.params.id = tx._id;
          await deleteTransaction(req, res, next);
          const deleted = await Transaction.findById(tx._id);
          expect(deleted).toBeNull();
      });
  });
});
