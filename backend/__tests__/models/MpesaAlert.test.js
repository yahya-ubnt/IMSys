
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MpesaAlert = require('../../models/MpesaAlert');
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
  await MpesaAlert.deleteMany({});
  await Tenant.deleteMany({});
});

describe('MpesaAlert Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an M-Pesa alert successfully', async () => {
    const alertData = {
      tenant: tenant._id,
      message: 'Payment received',
      transactionId: 'ABC123XYZ',
      amount: 1000,
      referenceNumber: 'REF123',
      paymentDate: new Date(),
    };
    const alert = new MpesaAlert(alertData);
    const savedAlert = await alert.save();

    expect(savedAlert._id).toBeDefined();
    expect(savedAlert.tenant).toEqual(tenant._id);
    expect(savedAlert.message).toBe(alertData.message);
    expect(savedAlert.transactionId).toBe(alertData.transactionId);
    expect(savedAlert.amount).toBe(alertData.amount);
    expect(savedAlert.referenceNumber).toBe(alertData.referenceNumber);
  });

  it('should fail to create an alert without a tenant', async () => {
    const alert = new MpesaAlert({
        message: 'Payment received',
        transactionId: 'ABC123XYZ',
        amount: 1000,
        referenceNumber: 'REF123',
        paymentDate: new Date(),
    });
    let err;
    try {
      await alert.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail with a duplicate transactionId', async () => {
    const alertData1 = {
        tenant: tenant._id,
        message: 'Payment 1',
        transactionId: 'DUPLICATE_ID',
        amount: 500,
        referenceNumber: 'REF1',
        paymentDate: new Date(),
    };
    const alert1 = new MpesaAlert(alertData1);
    await alert1.save();

    const alertData2 = {
        tenant: tenant._id,
        message: 'Payment 2',
        transactionId: 'DUPLICATE_ID',
        amount: 800,
        referenceNumber: 'REF2',
        paymentDate: new Date(),
    };
    const alert2 = new MpesaAlert(alertData2);
    let err;
    try {
        await alert2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
