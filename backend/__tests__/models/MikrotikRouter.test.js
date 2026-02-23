
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MikrotikRouter = require('../../models/MikrotikRouter');
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
  await MikrotikRouter.deleteMany({});
  await Tenant.deleteMany({});
});

describe('MikrotikRouter Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a Mikrotik router successfully', async () => {
    const routerData = {
      tenant: tenant._id,
      name: 'Main Router',
      ipAddress: '192.168.88.1',
      apiUsername: 'admin',
      apiPassword: 'password',
    };
    const router = new MikrotikRouter(routerData);
    const savedRouter = await router.save();

    expect(savedRouter._id).toBeDefined();
    expect(savedRouter.name).toBe(routerData.name);
    expect(savedRouter.tenant).toEqual(tenant._id);
    expect(savedRouter.ipAddress).toBe(routerData.ipAddress);
    expect(savedRouter.apiPort).toBe(8728);
    expect(savedRouter.isCoreRouter).toBe(false);
    expect(savedRouter.isOnline).toBe(false);
  });

  it('should fail to create a router without a name', async () => {
    const router = new MikrotikRouter({
        tenant: tenant._id,
        ipAddress: '192.168.88.1',
        apiUsername: 'admin',
        apiPassword: 'password',
    });
    let err;
    try {
      await router.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail with an invalid IP address', async () => {
    const router = new MikrotikRouter({
        tenant: tenant._id,
        name: 'Invalid IP Router',
        ipAddress: 'invalid-ip',
        apiUsername: 'admin',
        apiPassword: 'password',
    });
    let err;
    try {
        await router.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.ipAddress).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and ipAddress', async () => {
    const routerData = {
        tenant: tenant._id,
        name: 'Router 1',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
    };
    const router1 = new MikrotikRouter(routerData);
    await router1.save();

    const router2 = new MikrotikRouter({
        tenant: tenant._id,
        name: 'Router 2',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin2',
        apiPassword: 'password2',
    });
    let err;
    try {
        await router2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
