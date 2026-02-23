
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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
  await Tenant.deleteMany({});
});

describe('Tenant Model Test', () => {
  it('should create & save a tenant successfully', async () => {
    const tenantData = { name: 'Test Tenant' };
    const tenant = new Tenant(tenantData);
    const savedTenant = await tenant.save();

    expect(savedTenant._id).toBeDefined();
    expect(savedTenant.name).toBe(tenantData.name);
    expect(savedTenant.status).toBe('active');
  });

  it('should fail to create a tenant without a name', async () => {
    const tenant = new Tenant({});
    let err;
    try {
      await tenant.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail with an invalid status', async () => {
    const tenant = new Tenant({
        name: 'Test Tenant',
        status: 'invalid_status'
    });
    let err;
    try {
        await tenant.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
