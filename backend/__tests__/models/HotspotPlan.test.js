
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const HotspotPlan = require('../../models/HotspotPlan');
const Tenant = require('../../models/Tenant');
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
  await HotspotPlan.deleteMany({});
  await Tenant.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('HotspotPlan Model Test', () => {
  let tenant;
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
  });

  it('should create & save a hotspot plan successfully', async () => {
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
    const plan = new HotspotPlan(planData);
    const savedPlan = await plan.save();

    expect(savedPlan._id).toBeDefined();
    expect(savedPlan.name).toBe(planData.name);
    expect(savedPlan.price).toBe(planData.price);
    expect(savedPlan.tenant).toEqual(tenant._id);
    expect(savedPlan.mikrotikRouter).toEqual(router._id);
    expect(savedPlan.timeLimitValue).toBe(planData.timeLimitValue);
    expect(savedPlan.timeLimitUnit).toBe(planData.timeLimitUnit);
    expect(savedPlan.server).toBe(planData.server);
    expect(savedPlan.profile).toBe(planData.profile);
    expect(savedPlan.dataLimitValue).toBe(0);
    expect(savedPlan.sharedUsers).toBe(1);
    expect(savedPlan.showInCaptivePortal).toBe(true);
  });

  it('should fail to create a plan without a name', async () => {
    const plan = new HotspotPlan({
        price: 100,
        tenant: tenant._id,
        mikrotikRouter: router._id,
        timeLimitValue: 1,
        timeLimitUnit: 'hours',
        server: 'all',
        profile: 'default',
    });
    let err;
    try {
      await plan.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and name', async () => {
    const planData = {
        name: 'Unique Plan',
        price: 100,
        tenant: tenant._id,
        mikrotikRouter: router._id,
        timeLimitValue: 1,
        timeLimitUnit: 'hours',
        server: 'all',
        profile: 'default',
    };
    const plan1 = new HotspotPlan(planData);
    await plan1.save();

    const plan2 = new HotspotPlan(planData);
    let err;
    try {
        await plan2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with invalid timeLimitUnit', async () => {
    const planData = {
        name: 'Invalid Plan',
        price: 100,
        tenant: tenant._id,
        mikrotikRouter: router._id,
        timeLimitValue: 1,
        timeLimitUnit: 'invalid',
        server: 'all',
        profile: 'default',
    };
    const plan = new HotspotPlan(planData);
    let err;
    try {
        await plan.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.timeLimitUnit).toBeDefined();
  });
});
