
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MikrotikUser = require('../../models/MikrotikUser');
const Tenant = require('../../models/Tenant');
const Package = require('../../models/Package');
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
  await MikrotikUser.deleteMany({});
  await Tenant.deleteMany({});
  await Package.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('MikrotikUser Model Test', () => {
  let tenant;
  let pkg;
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

    pkg = new Package({
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        name: 'Basic',
        price: 1000,
    });
    await pkg.save();
  });

  it('should create & save a Mikrotik user successfully', async () => {
    const userData = {
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        package: pkg._id,
        username: 'testuser',
        officialName: 'Test User',
        mPesaRefNo: 'MPESA123',
        billingCycle: 'Monthly',
        mobileNumber: '1234567890',
        expiryDate: new Date(),
    };
    const user = new MikrotikUser(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.tenant).toEqual(tenant._id);
    expect(savedUser.isSuspended).toBe(false);
    expect(savedUser.isManuallyDisconnected).toBe(false);
    expect(savedUser.isOnline).toBe(false);
    expect(savedUser.provisionedOnMikrotik).toBe(false);
    expect(savedUser.syncStatus).toBe('synced');
    expect(savedUser.walletBalance).toBe(0);
  });

  it('should fail to create a user without required fields', async () => {
    const user = new MikrotikUser({ tenant: tenant._id });
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.mikrotikRouter).toBeDefined();
    expect(err.errors.serviceType).toBeDefined();
    expect(err.errors.package).toBeDefined();
    expect(err.errors.username).toBeDefined();
    expect(err.errors.officialName).toBeDefined();
    expect(err.errors.mPesaRefNo).toBeDefined();
    expect(err.errors.billingCycle).toBeDefined();
    expect(err.errors.mobileNumber).toBeDefined();
    expect(err.errors.expiryDate).toBeDefined();
  });

  it('should enforce unique username per tenant', async () => {
    const userData = {
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        package: pkg._id,
        username: 'uniqueuser',
        officialName: 'Test User 1',
        mPesaRefNo: 'MPESA1',
        billingCycle: 'Monthly',
        mobileNumber: '111',
        expiryDate: new Date(),
    };
    const user1 = new MikrotikUser(userData);
    await user1.save();

    const user2 = new MikrotikUser({ ...userData, officialName: 'Test User 2', mPesaRefNo: 'MPESA2', mobileNumber: '222' });
    let err;
    try {
        await user2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
