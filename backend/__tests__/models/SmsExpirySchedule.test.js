
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SmsExpirySchedule = require('../../models/SmsExpirySchedule');
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
  await SmsExpirySchedule.deleteMany({});
  await Tenant.deleteMany({});
});

describe('SmsExpirySchedule Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an SMS expiry schedule successfully', async () => {
    const scheduleData = {
      tenant: tenant._id,
      name: 'Expiry Reminder',
      days: 3,
      messageBody: 'Your subscription is expiring soon.',
    };
    const schedule = new SmsExpirySchedule(scheduleData);
    const savedSchedule = await schedule.save();

    expect(savedSchedule._id).toBeDefined();
    expect(savedSchedule.name).toBe(scheduleData.name);
    expect(savedSchedule.tenant).toEqual(tenant._id);
    expect(savedSchedule.days).toBe(scheduleData.days);
    expect(savedSchedule.messageBody).toBe(scheduleData.messageBody);
    expect(savedSchedule.timing).toBe('Before');
    expect(savedSchedule.status).toBe('Active');
  });

  it('should fail to create a schedule without required fields', async () => {
    const schedule = new SmsExpirySchedule({ tenant: tenant._id });
    let err;
    try {
      await schedule.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.days).toBeDefined();
    expect(err.errors.messageBody).toBeDefined();
  });

  it('should enforce unique name per tenant', async () => {
    const scheduleData = {
        tenant: tenant._id,
        name: 'Unique Schedule',
        days: 1,
        messageBody: 'Message 1',
    };
    const schedule1 = new SmsExpirySchedule(scheduleData);
    await schedule1.save();

    const schedule2 = new SmsExpirySchedule({ ...scheduleData, messageBody: 'Message 2' });
    let err;
    try {
        await schedule2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with an invalid timing', async () => {
    const scheduleData = {
        tenant: tenant._id,
        name: 'Invalid Timing',
        days: 1,
        messageBody: 'Test',
        timing: 'Invalid'
    };
    const schedule = new SmsExpirySchedule(scheduleData);
    let err;
    try {
        await schedule.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.timing).toBeDefined();
  });

  it('should fail with an invalid status', async () => {
    const scheduleData = {
        tenant: tenant._id,
        name: 'Invalid Status',
        days: 1,
        messageBody: 'Test',
        status: 'Invalid'
    };
    const schedule = new SmsExpirySchedule(scheduleData);
    let err;
    try {
        await schedule.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
