
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const HotspotTransaction = require('../../models/HotspotTransaction');
const Tenant = require('../../models/Tenant');
const HotspotPlan = require('../../models/HotspotPlan');
const MikrotikRouter = require('../../models/MikrotikRouter');

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
  await HotspotTransaction.deleteMany({});
  await Tenant.deleteMany({});
  await HotspotPlan.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('HotspotTransaction Model Test', () => {
  let tenant;
  let plan;
  let router;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();

    router = new MikrotikRouter({
        tenant: tenant._id,
        name: 'Test Router',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password'
    });
    await router.save();

    const planData = {
        name: 'Basic Plan',
        price: 100,
        tenant: tenant._id,
        mikrotikRouter: router._id,
        timeLimitValue: 1,
        timeLimitUnit: 'hours',
        server: 'all',
        profile: 'default',
      };
    plan = new HotspotPlan(planData);
    await plan.save();
  });

  it('should create & save a hotspot transaction successfully', async () => {
    const transactionData = {
      tenant: tenant._id,
      planId: plan._id,
      phoneNumber: '1234567890',
      macAddress: '00:11:22:33:44:55',
      amount: 100,
    };
    const transaction = new HotspotTransaction(transactionData);
    const savedTransaction = await transaction.save();

    expect(savedTransaction._id).toBeDefined();
    expect(savedTransaction.tenant).toEqual(tenant._id);
    expect(savedTransaction.planId).toEqual(plan._id);
    expect(savedTransaction.phoneNumber).toBe(transactionData.phoneNumber);
    expect(savedTransaction.macAddress).toBe(transactionData.macAddress);
    expect(savedTransaction.amount).toBe(transactionData.amount);
    expect(savedTransaction.status).toBe('pending');
  });

  it('should fail to create a transaction without a tenant', async () => {
    const transaction = new HotspotTransaction({
        planId: plan._id,
        phoneNumber: '1234567890',
        macAddress: '00:11:22:33:44:55',
        amount: 100,
    });
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail with a duplicate transactionId', async () => {
    const transactionData1 = {
        tenant: tenant._id,
        planId: plan._id,
        phoneNumber: '1234567890',
        macAddress: '00:11:22:33:44:55',
        amount: 100,
        transactionId: 'uniqueId123'
    };
    const transaction1 = new HotspotTransaction(transactionData1);
    await transaction1.save();

    const transactionData2 = {
        tenant: tenant._id,
        planId: plan._id,
        phoneNumber: '0987654321',
        macAddress: '55:44:33:22:11:00',
        amount: 200,
        transactionId: 'uniqueId123'
    };
    const transaction2 = new HotspotTransaction(transactionData2);
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
