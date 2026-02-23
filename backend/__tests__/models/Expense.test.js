
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Expense = require('../../models/Expense');
const Tenant = require('../../models/Tenant');
const ExpenseType = require('../../models/ExpenseType');
const User = require('../../models/User');

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

afterEach(async () => {
  await Expense.deleteMany({});
  await Tenant.deleteMany({});
  await ExpenseType.deleteMany({});
  await User.deleteMany({});
});

describe('Expense Model Test', () => {
  let tenant;
  let expenseType;
  let user;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();

    expenseType = new ExpenseType({
        tenant: tenant._id,
        name: 'Office Supplies'
    });
    await expenseType.save();

    user = new User({
        tenant: tenant._id,
        fullName: 'Test User',
        email: 'user@test.com',
        password: 'password',
        phone: '1234567890'
    });
    await user.save();
  });

  it('should create & save an expense successfully', async () => {
    const expenseData = {
      tenant: tenant._id,
      title: 'New Expense',
      amount: 150.50,
      expenseType: expenseType._id,
      expenseBy: user._id,
      expenseDate: new Date(),
    };
    const expense = new Expense(expenseData);
    const savedExpense = await expense.save();

    expect(savedExpense._id).toBeDefined();
    expect(savedExpense.title).toBe(expenseData.title);
    expect(savedExpense.amount).toBe(expenseData.amount);
    expect(savedExpense.tenant).toEqual(tenant._id);
    expect(savedExpense.expenseType).toEqual(expenseType._id);
    expect(savedExpense.expenseBy).toEqual(user._id);
  });

  it('should fail to create an expense without a tenant', async () => {
    const expense = new Expense({
        title: 'New Expense',
        amount: 150.50,
        expenseType: expenseType._id,
        expenseBy: user._id,
        expenseDate: new Date(),
    });
    let err;
    try {
      await expense.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail to create an expense without a title', async () => {
    const expense = new Expense({
        tenant: tenant._id,
        amount: 150.50,
        expenseType: expenseType._id,
        expenseBy: user._id,
        expenseDate: new Date(),
    });
    let err;
    try {
      await expense.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.title).toBeDefined();
  });

  it('should fail to create an expense without an amount', async () => {
    const expense = new Expense({
        tenant: tenant._id,
        title: 'New Expense',
        expenseType: expenseType._id,
        expenseBy: user._id,
        expenseDate: new Date(),
    });
    let err;
    try {
      await expense.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).toBeDefined();
  });

  it('should fail to create an expense without an expenseType', async () => {
    const expense = new Expense({
        tenant: tenant._id,
        title: 'New Expense',
        amount: 150.50,
        expenseBy: user._id,
        expenseDate: new Date(),
    });
    let err;
    try {
      await expense.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.expenseType).toBeDefined();
  });

  it('should fail to create an expense without an expenseBy', async () => {
    const expense = new Expense({
        tenant: tenant._id,
        title: 'New Expense',
        amount: 150.50,
        expenseType: expenseType._id,
        expenseDate: new Date(),
    });
    let err;
    try {
      await expense.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.expenseBy).toBeDefined();
  });

  it('should fail to create an expense without an expenseDate', async () => {
    const expense = new Expense({
        tenant: tenant._id,
        title: 'New Expense',
        amount: 150.50,
        expenseType: expenseType._id,
        expenseBy: user._id,
    });
    let err;
    try {
      await expense.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.expenseDate).toBeDefined();
  });
});
