
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const WalletTransaction = require('../../models/WalletTransaction');
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
  await WalletTransaction.deleteMany({});
  await MikrotikUser.deleteMany({});
  await Tenant.deleteMany({});
  await Package.deleteMany({});
  await MikrotikRouter.deleteMany({});
});

describe('WalletTransaction Model Test', () => {
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

  it('should create & save a wallet transaction successfully', async () => {
    const transData = {
      tenant: tenant._id,
      mikrotikUser: mikrotikUser._id,
      transactionId: 'WTXN-001',
      type: 'Credit',
      amount: 500,
      source: 'M-Pesa',
      balanceAfter: 500,
    };
    const transaction = new WalletTransaction(transData);
    const savedTrans = await transaction.save();

    expect(savedTrans._id).toBeDefined();
    expect(savedTrans.transactionId).toBe(transData.transactionId);
    expect(savedTrans.type).toBe('Credit');
  });

  it('should fail without required fields', async () => {
    const transaction = new WalletTransaction({ tenant: tenant._id });
    let err;
    try {
      await transaction.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.mikrotikUser).toBeDefined();
    expect(err.errors.transactionId).toBeDefined();
    expect(err.errors.type).toBeDefined();
    expect(err.errors.amount).toBeDefined();
    expect(err.errors.source).toBeDefined();
    expect(err.errors.balanceAfter).toBeDefined();
  });

  it('should fail with a duplicate transactionId', async () => {
    const transData = {
        tenant: tenant._id,
        mikrotikUser: mikrotikUser._id,
        transactionId: 'WTXN-DUPLICATE',
        type: 'Credit',
        amount: 100,
        source: 'Cash',
        balanceAfter: 100,
    };
    await new WalletTransaction(transData).save();
    const duplicateTrans = new WalletTransaction(transData);
    
    await expect(duplicateTrans.save()).rejects.toThrow();
  });

  it('should fail with an invalid type', async () => {
    const transData = {
        tenant: tenant._id,
        mikrotikUser: mikrotikUser._id,
        transactionId: 'WTXN-INVALID',
        type: 'InvalidType',
        amount: 100,
        source: 'Cash',
        balanceAfter: 100,
    };
    const transaction = new WalletTransaction(transData);
    await expect(transaction.save()).rejects.toThrow('WalletTransaction validation failed: type: `InvalidType` is not a valid enum value for path `type`.');
  });
});
