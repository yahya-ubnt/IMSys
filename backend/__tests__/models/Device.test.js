
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Device = require('../../models/Device');
const Tenant = require('../../models/Tenant');
const MikrotikRouter = require('../../models/MikrotikRouter');
const { encrypt, decrypt } = require('../../utils/crypto');

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
  await Device.deleteMany({});
  await Tenant.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('Device Model Test', () => {
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

  it('should create & save a device successfully', async () => {
    const deviceData = {
      tenant: tenant._id,
      router: router._id,
      ipAddress: '192.168.1.10',
      macAddress: '00:11:22:33:44:55',
      deviceType: 'Access',
      loginPassword: 'devicePassword',
      wirelessPassword: 'wifiPassword'
    };
    const device = new Device(deviceData);
    const savedDevice = await device.save();

    expect(savedDevice._id).toBeDefined();
    expect(savedDevice.tenant).toEqual(tenant._id);
    expect(savedDevice.router).toEqual(router._id);
    expect(savedDevice.ipAddress).toBe(deviceData.ipAddress);
    expect(savedDevice.macAddress).toBe(deviceData.macAddress);
    expect(savedDevice.deviceType).toBe(deviceData.deviceType);
    expect(savedDevice.monitoringMode).toBe('NONE');
    expect(savedDevice.status).toBe('DOWN');
    
    // Check encryption
    expect(savedDevice.loginPassword).not.toBe('devicePassword');
    expect(decrypt(savedDevice.loginPassword)).toBe('devicePassword');
    expect(savedDevice.wirelessPassword).not.toBe('wifiPassword');
    expect(decrypt(savedDevice.wirelessPassword)).toBe('wifiPassword');
  });

  it('should fail to create a device without a tenant', async () => {
    const deviceData = {
        router: router._id,
        ipAddress: '192.168.1.10',
        macAddress: '00:11:22:33:44:55',
        deviceType: 'Access',
      };
    const device = new Device(deviceData);
    let err;
    try {
      await device.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail to create a device without a router', async () => {
    const deviceData = {
        tenant: tenant._id,
        ipAddress: '192.168.1.10',
        macAddress: '00:11:22:33:44:55',
        deviceType: 'Access',
      };
    const device = new Device(deviceData);
    let err;
    try {
      await device.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.router).toBeDefined();
  });

  it('should fail to create a device without an ipAddress', async () => {
    const deviceData = {
        tenant: tenant._id,
        router: router._id,
        macAddress: '00:11:22:33:44:55',
        deviceType: 'Access',
      };
    const device = new Device(deviceData);
    let err;
    try {
      await device.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.ipAddress).toBeDefined();
  });

  it('should fail to create a device without a macAddress', async () => {
    const deviceData = {
        tenant: tenant._id,
        router: router._id,
        ipAddress: '192.168.1.10',
        deviceType: 'Access',
      };
    const device = new Device(deviceData);
    let err;
    try {
      await device.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.macAddress).toBeDefined();
  });

  it('should fail to create a device without a deviceType', async () => {
    const deviceData = {
        tenant: tenant._id,
        router: router._id,
        ipAddress: '192.168.1.10',
        macAddress: '00:11:22:33:44:55',
      };
    const device = new Device(deviceData);
    let err;
    try {
      await device.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.deviceType).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and macAddress', async () => {
    const deviceData = {
        tenant: tenant._id,
        router: router._id,
        ipAddress: '192.168.1.10',
        macAddress: '00:11:22:33:44:55',
        deviceType: 'Access',
      };
    const device1 = new Device(deviceData);
    await device1.save();

    const device2 = new Device(deviceData);
    let err;
    try {
      await device2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });
});
