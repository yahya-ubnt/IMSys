
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const HotspotSession = require('../../models/HotspotSession');
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
  await HotspotSession.deleteMany({});
  await Tenant.deleteMany({});
  await HotspotPlan.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('HotspotSession Model Test', () => {
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

  it('should create & save a hotspot session successfully', async () => {
    const sessionData = {
      tenant: tenant._id,
      macAddress: '00:11:22:33:44:55',
      planId: plan._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600 * 1000), // 1 hour later
    };
    const session = new HotspotSession(sessionData);
    const savedSession = await session.save();

    expect(savedSession._id).toBeDefined();
    expect(savedSession.tenant).toEqual(tenant._id);
    expect(savedSession.macAddress).toBe(sessionData.macAddress);
    expect(savedSession.planId).toEqual(plan._id);
    expect(savedSession.dataUsage).toBe(0);
  });

  it('should fail to create a session without a tenant', async () => {
    const session = new HotspotSession({
        macAddress: '00:11:22:33:44:55',
        planId: plan._id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600 * 1000),
    });
    let err;
    try {
      await session.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and macAddress', async () => {
    const sessionData = {
        tenant: tenant._id,
        macAddress: '00:11:22:33:44:55',
        planId: plan._id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600 * 1000),
    };
    const session1 = new HotspotSession(sessionData);
    await session1.save();

    const session2 = new HotspotSession(sessionData);
    let err;
    try {
        await session2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
