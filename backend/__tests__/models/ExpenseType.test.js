
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

afterEach(async () => {
  await ExpenseType.deleteMany({});
  await Tenant.deleteMany({});
});

describe('ExpenseType Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an expense type successfully', async () => {
    const expenseTypeData = {
      name: 'Office Supplies',
      tenant: tenant._id,
    };
    const expenseType = new ExpenseType(expenseTypeData);
    const savedExpenseType = await expenseType.save();

    expect(savedExpenseType._id).toBeDefined();
    expect(savedExpenseType.name).toBe(expenseTypeData.name);
    expect(savedExpenseType.tenant).toEqual(tenant._id);
  });

  it('should fail to create an expense type without a name', async () => {
    const expenseType = new ExpenseType({ tenant: tenant._id });
    let err;
    try {
      await expenseType.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail to create an expense type without a tenant', async () => {
    const expenseType = new ExpenseType({ name: 'Office Supplies' });
    let err;
    try {
      await expenseType.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and name', async () => {
    const expenseTypeData = {
      name: 'Unique Expense Type',
      tenant: tenant._id,
    };
    const expenseType1 = new ExpenseType(expenseTypeData);
    await expenseType1.save();

    const expenseType2 = new ExpenseType(expenseTypeData);
    let err;
    try {
      await expenseType2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });

  it('should allow two expense types with the same name for different tenants', async () => {
    const tenant2 = new Tenant({
      name: 'Another Tenant',
      email: 'tenant2@test.com',
      password: 'password123',
    });
    await tenant2.save();

    const expenseTypeData1 = {
      name: 'Shared Name Expense Type',
      tenant: tenant._id,
    };
    const expenseType1 = new ExpenseType(expenseTypeData1);
    await expenseType1.save();

    const expenseTypeData2 = {
      name: 'Shared Name Expense Type',
      tenant: tenant2._id,
    };
    const expenseType2 = new ExpenseType(expenseTypeData2);
    const savedExpenseType2 = await expenseType2.save();
    expect(savedExpenseType2._id).toBeDefined();
  });
});
