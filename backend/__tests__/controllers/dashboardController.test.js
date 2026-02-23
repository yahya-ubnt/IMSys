const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getCollectionsSummary,
  getMonthlyCollectionsAndExpenses,
  getDailyCollectionsAndExpenses,
  getMonthlyExpenseSummary,
  getNewSubscriptionsCount,
  getTotalUsersCount,
  getActiveUsersCount,
  getExpiredUsersCount,
  getExpensesSummary,
} = require('../../controllers/dashboardController');
const Transaction = require('../../models/Transaction');
const Expense = require('../../models/Expense');
const ExpenseType = require('../../models/ExpenseType');
const User = require('../../models/User');
const MikrotikUser = require('../../models/MikrotikUser');
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

describe('Dashboard Controller (Integration)', () => {
  let req, res, next, tenant, admin, expType;

  beforeEach(async () => {
    await Transaction.deleteMany({});
    await Expense.deleteMany({});
    await ExpenseType.deleteMany({});
    await User.deleteMany({});
    await MikrotikUser.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Dashboard Tenant' });
    admin = await User.create({
        fullName: 'Admin User',
        email: 'admin@test.com',
        password: 'password',
        phone: '123',
        roles: ['ADMIN'],
        tenant: tenant._id
    });
    expType = await ExpenseType.create({
        name: 'Rent',
        tenant: tenant._id
    });

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

  describe('getCollectionsSummary', () => {
    it('should return collection totals for today, week, month, year', async () => {
        const today = new Date();
        await Transaction.create({
            transactionId: 'TX1',
            amount: 1000,
            referenceNumber: 'REF1',
            officialName: 'John',
            paymentMethod: 'Cash',
            tenant: tenant._id,
            transactionDate: today,
            msisdn: '123'
        });

        await getCollectionsSummary(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            today: 1000
        }));
    });
  });

  describe('getTotalUsersCount', () => {
    it('should return total count of users', async () => {
        await MikrotikUser.create({
            officialName: 'U1',
            username: 'u1',
            email: 'u1@test.com',
            phone: '1',
            mPesaRefNo: 'R1',
            serviceType: 'pppoe',
            package: new mongoose.Types.ObjectId(),
            mikrotikRouter: new mongoose.Types.ObjectId(),
            tenant: tenant._id,
            billingCycle: 'Monthly',
            mobileNumber: '1',
            expiryDate: new Date()
        });

        await getTotalUsersCount(req, res, next);
        expect(res.json).toHaveBeenCalledWith({ totalUsers: 1 });
    });
  });

  describe('getMonthlyCollectionsAndExpenses', () => {
    it('should return monthly collections and expenses for a given year', async () => {
        const year = '2024';
        const jan = new Date(2024, 0, 15);
        await Transaction.create({
            transactionId: 'TX_JAN',
            amount: 1000,
            referenceNumber: 'REF_JAN',
            officialName: 'John',
            paymentMethod: 'Cash',
            tenant: tenant._id,
            transactionDate: jan,
            msisdn: '123'
        });

        await Expense.create({
            title: 'Office Rent',
            amount: 500,
            expenseDate: jan,
            expenseType: expType._id,
            expenseBy: admin._id,
            tenant: tenant._id
        });

        req.query = { year };
        await getMonthlyCollectionsAndExpenses(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ month: 'January', collections: 1000, expenses: 500 })
        ]));
    });
  });
});
