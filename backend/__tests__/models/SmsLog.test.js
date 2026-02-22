
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SmsLog = require('../../models/SmsLog');
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
  await SmsLog.deleteMany({});
  await Tenant.deleteMany({});
});

describe('SmsLog Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an SMS log successfully', async () => {
    const logData = {
      tenant: tenant._id,
      mobileNumber: '1234567890',
      message: 'Test SMS message',
    };
    const log = new SmsLog(logData);
    const savedLog = await log.save();

    expect(savedLog._id).toBeDefined();
    expect(savedLog.tenant).toEqual(tenant._id);
    expect(savedLog.mobileNumber).toBe(logData.mobileNumber);
    expect(savedLog.message).toBe(logData.message);
    expect(savedLog.messageType).toBe('System');
    expect(savedLog.smsStatus).toBe('Pending');
  });

  it('should fail to create a log without required fields', async () => {
    const log = new SmsLog({ tenant: tenant._id });
    let err;
    try {
      await log.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.mobileNumber).toBeDefined();
    expect(err.errors.message).toBeDefined();
  });

  it('should fail with an invalid messageType', async () => {
    const logData = {
        tenant: tenant._id,
        mobileNumber: '1234567890',
        message: 'Test SMS message',
        messageType: 'InvalidType'
    };
    const log = new SmsLog(logData);
    let err;
    try {
        await log.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.messageType).toBeDefined();
  });

  it('should fail with an invalid smsStatus', async () => {
    const logData = {
        tenant: tenant._id,
        mobileNumber: '1234567890',
        message: 'Test SMS message',
        smsStatus: 'InvalidStatus'
    };
    const log = new SmsLog(logData);
    let err;
    try {
        await log.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.smsStatus).toBeDefined();
  });
});
