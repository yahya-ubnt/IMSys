
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserDowntimeLog = require('../../models/UserDowntimeLog');
const Tenant = require('../../models/Tenant');
const MikrotikUser = require('../../models/MikrotikUser');
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
  await UserDowntimeLog.deleteMany({});
  await MikrotikUser.deleteMany({});
  await Tenant.deleteMany({});
  await Package.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('UserDowntimeLog Model Test', () => {
  let tenant;
  let mikrotikUser;

  beforeEach(async () => {
    tenant = new Tenant({ name: 'Test Tenant' });
    await tenant.save();

    const router = new MikrotikRouter({
        tenant: tenant._id,
        name: 'Test Router',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password'
    });
    await router.save();

    const pkg = new Package({
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        name: 'Basic',
        price: 1000,
    });
    await pkg.save();

    mikrotikUser = new MikrotikUser({
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
    });
    await mikrotikUser.save();
  });

  it('should create & save a user downtime log successfully', async () => {
    const logData = {
      tenant: tenant._id,
      mikrotikUser: mikrotikUser._id,
      downStartTime: new Date(),
    };
    const log = new UserDowntimeLog(logData);
    const savedLog = await log.save();

    expect(savedLog._id).toBeDefined();
    expect(savedLog.tenant).toEqual(tenant._id);
    expect(savedLog.mikrotikUser).toEqual(mikrotikUser._id);
    expect(savedLog.downStartTime).toBe(logData.downStartTime);
  });

  it('should fail to create a log without required fields', async () => {
    const log = new UserDowntimeLog({ tenant: tenant._id });
    let err;
    try {
      await log.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.mikrotikUser).toBeDefined();
    expect(err.errors.downStartTime).toBeDefined();
  });
});
