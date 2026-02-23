jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Bill = require('../../models/Bill');
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
  await Bill.deleteMany({});
  await Tenant.deleteMany({});
});

describe('Bill Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a bill successfully', async () => {
    const billData = {
      name: 'Office Rent',
      amount: 50000,
      dueDate: 28,
      category: 'Company',
      month: 2,
      year: 2026,
      tenant: tenant._id,
    };
    const bill = new Bill(billData);
    const savedBill = await bill.save();

    expect(savedBill._id).toBeDefined();
    expect(savedBill.name).toBe(billData.name);
    expect(savedBill.amount).toBe(billData.amount);
    expect(savedBill.status).toBe('Not Paid');
    expect(savedBill.tenant).toEqual(tenant._id);
  });

  it('should fail to create a bill without required fields', async () => {
    const bill = new Bill({ tenant: tenant._id });
    let err;
    try {
      await bill.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.amount).toBeDefined();
    expect(err.errors.dueDate).toBeDefined();
    expect(err.errors.category).toBeDefined();
    expect(err.errors.month).toBeDefined();
    expect(err.errors.year).toBeDefined();
  });

  it('should fail with invalid enum value for category', async () => {
    const billData = {
      name: 'Test Bill',
      amount: 100,
      dueDate: 15,
      category: 'InvalidCategory',
      month: 2,
      year: 2026,
      tenant: tenant._id,
    };
    const bill = new Bill(billData);
    let err;
    try {
      await bill.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.category).toBeDefined();
  });

  it('should enforce the unique compound index', async () => {
    const billData = {
      name: 'Office Rent',
      amount: 50000,
      dueDate: 28,
      category: 'Company',
      month: 2,
      year: 2026,
      tenant: tenant._id,
    };
    const bill1 = new Bill(billData);
    await bill1.save();

    const bill2 = new Bill(billData);
    let err;
    try {
      await bill2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });

  it('should allow two bills with different names for the same tenant and month/year', async () => {
    const billData1 = {
      name: 'Office Rent',
      amount: 50000,
      dueDate: 28,
      category: 'Company',
      month: 2,
      year: 2026,
      tenant: tenant._id,
    };
    const bill1 = new Bill(billData1);
    await bill1.save();

    const billData2 = {
      name: 'Internet Bill',
      amount: 5000,
      dueDate: 15,
      category: 'Company',
      month: 2,
      year: 2026,
      tenant: tenant._id,
    };
    const bill2 = new Bill(billData2);
    const savedBill2 = await bill2.save();
    expect(savedBill2._id).toBeDefined();
  });
});
