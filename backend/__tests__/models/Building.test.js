jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Building = require('../../models/Building');
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
  await Building.deleteMany({});
  await Tenant.deleteMany({});
});

describe('Building Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a building successfully', async () => {
    const buildingData = {
      name: 'Test Building',
      address: '123 Test St',
      tenant: tenant._id,
    };
    const building = new Building(buildingData);
    const savedBuilding = await building.save();

    expect(savedBuilding._id).toBeDefined();
    expect(savedBuilding.name).toBe(buildingData.name);
    expect(savedBuilding.tenant).toEqual(tenant._id);
  });

  it('should fail to create a building without a name', async () => {
    const building = new Building({ address: '123 Test St', tenant: tenant._id });
    let err;
    try {
      await building.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail to create a building without a tenant', async () => {
    const building = new Building({ name: 'Test Building', address: '123 Test St' });
    let err;
    try {
      await building.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and name', async () => {
    const buildingData = {
      name: 'Unique Building',
      tenant: tenant._id,
    };
    const building1 = new Building(buildingData);
    await building1.save();

    const building2 = new Building(buildingData);
    let err;
    try {
      await building2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });

  it('should allow two buildings with the same name for different tenants', async () => {
    const tenant2 = new Tenant({
      name: 'Another Tenant',
      email: 'tenant2@test.com',
      password: 'password123',
    });
    await tenant2.save();

    const buildingData1 = {
      name: 'Shared Name Building',
      tenant: tenant._id,
    };
    const building1 = new Building(buildingData1);
    await building1.save();

    const buildingData2 = {
      name: 'Shared Name Building',
      tenant: tenant2._id,
    };
    const building2 = new Building(buildingData2);
    const savedBuilding2 = await building2.save();
    expect(savedBuilding2._id).toBeDefined();
  });
});
