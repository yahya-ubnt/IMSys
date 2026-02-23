
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

afterEach(async () => {
  await DailyTransaction.deleteMany({});
  await Tenant.deleteMany({});
});

describe('DailyTransaction Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a daily transaction successfully', async () => {
    const transactionData = {
      tenant: tenant._id,
      amount: 100,
      method: 'M-Pesa',
      label: 'Test Transaction',
    };
    const transaction = new DailyTransaction(transactionData);
    const savedTransaction = await transaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.tenant).toEqual(tenant._id);
    expect(savedTransaction.amount).toBe(transactionData.amount);
    expect(savedTransaction.method).toBe(transactionData.method);
    expect(savedTransaction.label).toBe(transactionData.label);
    expect(savedTransaction.category).toBe('Personal');
  });

  it('should fail to create a transaction without a tenant', async () => {
    const transactionData = {
      amount: 100,
      method: 'M-Pesa',
      label: 'Test Transaction',
    };
    const transaction = new DailyTransaction(transactionData);
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail to create a transaction without an amount', async () => {
    const transactionData = {
      tenant: tenant._id,
      method: 'M-Pesa',
      label: 'Test Transaction',
    };
    const transaction = new DailyTransaction(transactionData);
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).toBeDefined();
  });

  it('should fail to create a transaction without a method', async () => {
    const transactionData = {
      tenant: tenant._id,
      amount: 100,
      label: 'Test Transaction',
    };
    const transaction = new DailyTransaction(transactionData);
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.method).toBeDefined();
  });

  it('should fail to create a transaction without a label', async () => {
    const transactionData = {
      tenant: tenant._id,
      amount: 100,
      method: 'M-Pesa',
    };
    const transaction = new DailyTransaction(transactionData);
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.label).toBeDefined();
  });

  it('should fail with an invalid method', async () => {
    const transactionData = {
      tenant: tenant._id,
      amount: 100,
      method: 'Invalid Method',
      label: 'Test Transaction',
    };
    const transaction = new DailyTransaction(transactionData);
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.method).toBeDefined();
  });

  it('should fail with an invalid category', async () => {
    const transactionData = {
      tenant: tenant._id,
      amount: 100,
      method: 'M-Pesa',
      label: 'Test Transaction',
      category: 'Invalid Category',
    };
    const transaction = new DailyTransaction(transactionData);
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.category).toBeDefined();
  });

  it('should create a transaction with the default category "Personal"', async () => {
    const transactionData = {
      tenant: tenant._id,
      amount: 100,
      method: 'M-Pesa',
      label: 'Test Transaction',
    };
    const transaction = new DailyTransaction(transactionData);
    const savedTransaction = await transaction.save();
    expect(savedTransaction.category).toBe('Personal');
  });
});
