
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set a dummy encryption key for testing
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex string

const SmsProvider = require('../../models/SmsProvider');
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
  await SmsProvider.deleteMany({});
  await Tenant.deleteMany({});
});

describe('SmsProvider Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an SMS provider successfully and encrypt credentials', async () => {
    const providerData = {
      tenant: tenant._id,
      name: 'Test Provider',
      providerType: 'celcom',
      credentials: { apiKey: '123', senderId: 'Test' },
    };
    const provider = new SmsProvider(providerData);
    const savedProvider = await provider.save();

    expect(savedProvider._id).toBeDefined();
    expect(savedProvider.name).toBe(providerData.name);
    expect(savedProvider.isActive).toBe(true); // First provider should be active

    // Check that the getter decrypts the credentials
    expect(savedProvider.credentials).toEqual({ apiKey: '123', senderId: 'Test' });

    // Check that the credentials are encrypted in the database
    const rawProvider = await SmsProvider.findById(savedProvider._id).lean();
    expect(rawProvider.credentials).toBeInstanceOf(Object);
    expect(rawProvider.credentials.iv).toBeDefined();
    expect(rawProvider.credentials.encryptedData).toBeDefined();
    expect(rawProvider.credentials.apiKey).toBeUndefined();
  });

  it('should only allow one active provider per tenant', async () => {
    const provider1 = new SmsProvider({
        tenant: tenant._id,
        name: 'Provider 1',
        providerType: 'celcom',
        credentials: { apiKey: '1' },
        isActive: true
    });
    await provider1.save();

    const provider2 = new SmsProvider({
        tenant: tenant._id,
        name: 'Provider 2',
        providerType: 'africastalking',
        credentials: { apiKey: '2' },
        isActive: true
    });
    await provider2.save();

    const p1 = await SmsProvider.findById(provider1._id);
    const p2 = await SmsProvider.findById(provider2._id);

    expect(p1.isActive).toBe(false);
    expect(p2.isActive).toBe(true);
  });

  it('should fail to create a provider without required fields', async () => {
    const provider = new SmsProvider({ tenant: tenant._id });
    let err;
    try {
      await provider.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.providerType).toBeDefined();
    expect(err.errors.credentials).toBeDefined();
  });

  it('should enforce unique name per tenant', async () => {
    const providerData = {
        tenant: tenant._id,
        name: 'Unique Provider',
        providerType: 'celcom',
        credentials: { apiKey: '123' },
    };
    const provider1 = new SmsProvider(providerData);
    await provider1.save();

    const provider2 = new SmsProvider({ ...providerData, providerType: 'twilio' });
    let err;
    try {
        await provider2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
