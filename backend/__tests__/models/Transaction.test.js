
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

afterEach(async () => {
  await Transaction.deleteMany({});
  await Tenant.deleteMany({});
});

describe('Transaction Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a transaction successfully', async () => {
    const transactionData = {
      tenant: tenant._id,
      transactionId: 'TXN12345',
      amount: 1500,
      referenceNumber: 'MPESA-REF-1',
      officialName: 'John Doe',
      msisdn: '254712345678',
      transactionDate: new Date(),
      paymentMethod: 'M-Pesa',
    };
    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.transactionId).toBe(transactionData.transactionId);
    expect(savedTransaction.tenant).toEqual(tenant._id);
  });

  it('should fail to create a transaction without required fields', async () => {
    const transaction = new Transaction({ tenant: tenant._id });
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.transactionId).toBeDefined();
    expect(err.errors.amount).toBeDefined();
    expect(err.errors.referenceNumber).toBeDefined();
    expect(err.errors.officialName).toBeDefined();
    expect(err.errors.msisdn).toBeDefined();
    expect(err.errors.transactionDate).toBeDefined();
    expect(err.errors.paymentMethod).toBeDefined();
  });

  it('should fail with a duplicate transactionId', async () => {
    const transactionData = {
        tenant: tenant._id,
        transactionId: 'TXN-DUPLICATE',
        amount: 100,
        referenceNumber: 'REF-A',
        officialName: 'User A',
        msisdn: '111',
        transactionDate: new Date(),
        paymentMethod: 'Cash',
    };
    const transaction1 = new Transaction(transactionData);
    await transaction1.save();

    const transaction2 = new Transaction({ ...transactionData, amount: 200 });
    let err;
    try {
        await transaction2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
