
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Voucher = require('../../models/Voucher');
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
  await Voucher.deleteMany({});
  await Tenant.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('Voucher Model Test', () => {
  let tenant;
  let router;

  beforeEach(async () => {
    tenant = new Tenant({ name: 'Test Tenant' });
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

  it('should create & save a voucher successfully', async () => {
    const voucherData = {
      tenant: tenant._id,
      mikrotikRouter: router._id,
      username: 'voucher-001',
      profile: '1-hour',
      price: 50,
      batch: 'batch-A',
    };
    const voucher = new Voucher(voucherData);
    const savedVoucher = await voucher.save();

    expect(savedVoucher._id).toBeDefined();
    expect(savedVoucher.username).toBe(voucherData.username);
    expect(savedVoucher.tenant).toEqual(tenant._id);
    expect(savedVoucher.mikrotikRouter).toEqual(router._id);
    expect(savedVoucher.status).toBe('active');
  });

  it('should fail to create a voucher without required fields', async () => {
    const voucher = new Voucher({ tenant: tenant._id });
    let err;
    try {
      await voucher.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.username).toBeDefined();
    expect(err.errors.profile).toBeDefined();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.mikrotikRouter).toBeDefined();
    expect(err.errors.batch).toBeDefined();
  });

  it('should enforce unique username per tenant', async () => {
    const voucherData = {
        tenant: tenant._id,
        mikrotikRouter: router._id,
        username: 'unique-voucher',
        profile: 'default',
        price: 100,
        batch: 'batch-B',
    };
    const voucher1 = new Voucher(voucherData);
    await voucher1.save();

    const voucher2 = new Voucher({ ...voucherData, batch: 'batch-C' });
    let err;
    try {
        await voucher2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with an invalid status', async () => {
    const voucherData = {
        tenant: tenant._id,
        mikrotikRouter: router._id,
        username: 'invalid-status-voucher',
        profile: 'default',
        price: 100,
        batch: 'batch-D',
        status: 'invalid'
    };
    const voucher = new Voucher(voucherData);
    let err;
    try {
        await voucher.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
