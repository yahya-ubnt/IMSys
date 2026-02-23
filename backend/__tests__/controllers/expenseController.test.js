const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../../controllers/expenseController');
const Expense = require('../../models/Expense');
const ExpenseType = require('../../models/ExpenseType');
const User = require('../../models/User');
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

describe('Expense Controller (Integration)', () => {
  let req, res, next, tenant, admin, expType;

  beforeEach(async () => {
    await Expense.deleteMany({});
    await ExpenseType.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Expense Tenant' });
    admin = await User.create({
        fullName: 'Admin User',
        email: 'admin@test.com',
        password: 'password',
        phone: '123',
        roles: ['ADMIN'],
        tenant: tenant._id
    });
    expType = await ExpenseType.create({
        name: 'Office',
        tenant: tenant._id
    });

    req = {
      params: {},
      user: admin,
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

  describe('createExpense', () => {
    it('should create an expense successfully', async () => {
      req.body = {
        title: 'Rent',
        amount: 1000,
        expenseType: expType._id,
        expenseDate: new Date(),
        description: 'Monthly office rent'
      };

      await createExpense(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const expense = await Expense.findOne({ title: 'Rent' });
      expect(expense).toBeDefined();
    });
  });

  describe('getExpenses', () => {
    it('should return populated expenses', async () => {
      await Expense.create({
        title: 'Supplies',
        amount: 100,
        expenseType: expType._id,
        expenseBy: admin._id,
        tenant: tenant._id,
        expenseDate: new Date()
      });

      await getExpenses(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ title: 'Supplies' })
      ]));
    });
  });

  describe('updateExpense', () => {
    it('should update an expense successfully', async () => {
        const e = await Expense.create({
            title: 'Initial',
            amount: 50,
            expenseType: expType._id,
            expenseBy: admin._id,
            tenant: tenant._id,
            expenseDate: new Date()
        });

        req.params.id = e._id;
        req.body = { title: 'Updated' };

        await updateExpense(req, res, next);
        const updated = await Expense.findById(e._id);
        expect(updated.title).toBe('Updated');
    });
  });

  describe('deleteExpense', () => {
      it('should delete an expense successfully', async () => {
          const e = await Expense.create({
              title: 'Delete me',
              amount: 50,
              expenseType: expType._id,
              expenseBy: admin._id,
              tenant: tenant._id,
              expenseDate: new Date()
          });

          req.params.id = e._id;
          await deleteExpense(req, res, next);
          const deleted = await Expense.findById(e._id);
          expect(deleted).toBeNull();
      });
  });
});
