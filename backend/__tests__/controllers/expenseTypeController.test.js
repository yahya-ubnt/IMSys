const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createExpenseType,
  getExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
} = require('../../controllers/expenseTypeController');
const ExpenseType = require('../../models/ExpenseType');
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

describe('Expense Type Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await ExpenseType.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Expense Type Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createExpenseType', () => {
    it('should create an expense type successfully', async () => {
      req.body = { name: 'Marketing', description: 'Ads' };

      await createExpenseType(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const et = await ExpenseType.findOne({ name: 'Marketing' });
      expect(et).toBeDefined();
    });

    it('should throw error if name already exists for the tenant', async () => {
        await ExpenseType.create({ name: 'Marketing', tenant: tenant._id });
        req.body = { name: 'Marketing' };

        await createExpenseType(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getExpenseTypes', () => {
      it('should return all types for tenant', async () => {
          await ExpenseType.create({ name: 'Type 1', tenant: tenant._id });
          await getExpenseTypes(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'Type 1' })
          ]));
      });
  });
});
