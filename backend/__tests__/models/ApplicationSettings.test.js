jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ApplicationSettings = require('../../models/ApplicationSettings');
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
  await ApplicationSettings.deleteMany({});
  await Tenant.deleteMany({});
});

describe('ApplicationSettings Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save application settings successfully', async () => {
    const settingsData = { tenant: tenant._id };
    const settings = new ApplicationSettings(settingsData);
    const savedSettings = await settings.save();

    expect(savedSettings._id).toBeDefined();
    expect(savedSettings.tenant).toEqual(tenant._id);
    expect(savedSettings.appName).toBe('MEDIATEK');
    expect(savedSettings.paymentGracePeriodDays).toBe(3);
    expect(savedSettings.currencySymbol).toBe('KES');
    expect(savedSettings.taxRate).toBe(0);
    expect(savedSettings.autoDisconnectUsers).toBe(true);
    expect(savedSettings.sendPaymentReminders).toBe(true);
    expect(savedSettings.disconnectTime).toBe('end_of_day');
  });

  it('should fail to create settings without a tenant', async () => {
    const settings = new ApplicationSettings({});
    let err;
    try {
      await settings.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should enforce uniqueness of the tenant field', async () => {
    const settings1 = new ApplicationSettings({ tenant: tenant._id });
    await settings1.save();

    const settings2 = new ApplicationSettings({ tenant: tenant._id });
    let err;
    try {
      await settings2.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error code
  });

  it('should encrypt and decrypt mpesaPaybill field', async () => {
    const paybillData = { shortcode: '600986', key: 'somekey' };
    const settings = new ApplicationSettings({
      tenant: tenant._id,
      mpesaPaybill: paybillData,
    });
    await settings.save();

    // Find the setting again to trigger the getter
    const foundSettings = await ApplicationSettings.findById(settings._id);
    expect(foundSettings.mpesaPaybill).toEqual(paybillData);

    // Also check the raw document to ensure it's encrypted
    const rawSettings = await ApplicationSettings.collection.findOne({ _id: settings._id });
    expect(rawSettings.mpesaPaybill).toBeDefined();
    expect(typeof rawSettings.mpesaPaybill).toBe('string');
    expect(rawSettings.mpesaPaybill).not.toEqual(paybillData);
  });

  it('should encrypt and decrypt mpesaTill field', async () => {
    const tillData = { tillNumber: '123456', key: 'anotherkey' };
    const settings = new ApplicationSettings({
      tenant: tenant._id,
      mpesaTill: tillData,
    });
    await settings.save();

    const foundSettings = await ApplicationSettings.findById(settings._id);
    expect(foundSettings.mpesaTill).toEqual(tillData);

    const rawSettings = await ApplicationSettings.collection.findOne({ _id: settings._id });
    expect(rawSettings.mpesaTill).toBeDefined();
    expect(typeof rawSettings.mpesaTill).toBe('string');
    expect(rawSettings.mpesaTill).not.toEqual(tillData);
  });
});