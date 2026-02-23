
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Package = require('../../models/Package');
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
  await Package.deleteMany({});
  await Tenant.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('Package Model Test', () => {
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

  it('should create & save a package successfully', async () => {
    const packageData = {
      tenant: tenant._id,
      mikrotikRouter: router._id,
      serviceType: 'pppoe',
      name: 'Basic Plan',
      price: 1500,
    };
    const pkg = new Package(packageData);
    const savedPkg = await pkg.save();

    expect(savedPkg._id).toBeDefined();
    expect(savedPkg.name).toBe(packageData.name);
    expect(savedPkg.price).toBe(packageData.price);
    expect(savedPkg.tenant).toEqual(tenant._id);
    expect(savedPkg.mikrotikRouter).toEqual(router._id);
    expect(savedPkg.serviceType).toBe('pppoe');
    expect(savedPkg.status).toBe('active');
  });

  it('should fail to create a package without required fields', async () => {
    const pkg = new Package({ tenant: tenant._id });
    let err;
    try {
      await pkg.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.mikrotikRouter).toBeDefined();
    expect(err.errors.serviceType).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.price).toBeDefined();
  });

  it('should fail with an invalid serviceType', async () => {
    const packageData = {
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'invalid',
        name: 'Invalid Plan',
        price: 1500,
    };
    const pkg = new Package(packageData);
    let err;
    try {
        await pkg.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.serviceType).toBeDefined();
  });

  it('should fail with an invalid status', async () => {
    const packageData = {
        tenant: tenant._id,
        mikrotikRouter: router._id,
        serviceType: 'pppoe',
        name: 'Another Plan',
        price: 2000,
        status: 'invalid'
    };
    const pkg = new Package(packageData);
    let err;
    try {
        await pkg.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
