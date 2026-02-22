
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Notification = require('../../models/Notification');
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
  await Notification.deleteMany({});
  await Tenant.deleteMany({});
});

describe('Notification Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a notification successfully', async () => {
    const notificationData = {
      tenant: tenant._id,
      message: 'This is a test notification.',
    };
    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();

    expect(savedNotification._id).toBeDefined();
    expect(savedNotification.tenant).toEqual(tenant._id);
    expect(savedNotification.message).toBe(notificationData.message);
    expect(savedNotification.type).toBe('system');
    expect(savedNotification.status).toBe('unread');
  });

  it('should fail to create a notification without a message', async () => {
    const notification = new Notification({ tenant: tenant._id });
    let err;
    try {
      await notification.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.message).toBeDefined();
  });

  it('should fail to create a notification without a tenant', async () => {
    const notification = new Notification({ message: 'Test message' });
    let err;
    try {
      await notification.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail with an invalid type', async () => {
    const notification = new Notification({
        tenant: tenant._id,
        message: 'Test message',
        type: 'invalid_type'
    });
    let err;
    try {
        await notification.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
  });

  it('should fail with an invalid status', async () => {
    const notification = new Notification({
        tenant: tenant._id,
        message: 'Test message',
        status: 'invalid_status'
    });
    let err;
    try {
        await notification.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
