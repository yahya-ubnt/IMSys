const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createDailyTransaction,
  getDailyTransactions,
  getDailyTransactionById,
  updateDailyTransaction,
  deleteDailyTransaction,
} = require('../../controllers/dailyTransactionController');
const DailyTransaction = require('../../models/DailyTransaction');
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

describe('Daily Transaction Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await DailyTransaction.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Daily Tx Tenant' });

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

  describe('createDailyTransaction', () => {
    it('should create a daily transaction successfully', async () => {
      req.body = {
        amount: 500,
        method: 'M-Pesa',
        description: 'Office supplies',
        category: 'Company',
        label: 'Expense'
      };

      await createDailyTransaction(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const tx = await DailyTransaction.findOne({ description: 'Office supplies' });
      expect(tx).toBeDefined();
    });
  });

  describe('getDailyTransactions', () => {
    it('should return transactions with pagination', async () => {
      await DailyTransaction.create({
        amount: 100,
        method: 'Cash',
        description: 'Snack',
        category: 'Personal',
        label: 'Expense',
        tenant: tenant._id,
        date: new Date()
      });

      await getDailyTransactions(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          count: 1,
          transactions: expect.arrayContaining([
              expect.objectContaining({ description: 'Snack' })
          ])
      }));
    });
  });

  describe('updateDailyTransaction', () => {
    it('should update a transaction successfully', async () => {
      const tx = await DailyTransaction.create({
        amount: 100,
        method: 'Cash',
        description: 'Initial',
        category: 'Personal',
        label: 'Expense',
        tenant: tenant._id,
        date: new Date()
      });

      req.params.id = tx._id;
      req.body = { description: 'Updated' };

      await updateDailyTransaction(req, res, next);
      const updated = await DailyTransaction.findById(tx._id);
      expect(updated.description).toBe('Updated');
    });
  });

  describe('deleteDailyTransaction', () => {
      it('should delete a transaction successfully', async () => {
          const tx = await DailyTransaction.create({
              amount: 100,
              method: 'Cash',
              description: 'Delete me',
              category: 'Personal',
              label: 'Expense',
              tenant: tenant._id,
              date: new Date()
          });

          req.params.id = tx._id;
          await deleteDailyTransaction(req, res, next);
          const deleted = await DailyTransaction.findById(tx._id);
          expect(deleted).toBeNull();
      });
  });
});
