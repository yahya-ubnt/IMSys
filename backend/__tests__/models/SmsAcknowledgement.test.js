
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SmsAcknowledgement = require('../../models/SmsAcknowledgement');
const Tenant = require('../../models/Tenant');
const SmsTemplate = require('../../models/SmsTemplate');

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
  await SmsAcknowledgement.deleteMany({});
  await Tenant.deleteMany({});
  await SmsTemplate.deleteMany({});
});

describe('SmsAcknowledgement Model Test', () => {
  let tenant;
  let smsTemplate;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();

    smsTemplate = new SmsTemplate({
        tenant: tenant._id,
        name: 'Test Template',
        messageBody: 'Hello {{name}}'
    });
    await smsTemplate.save();
  });

  it('should create & save an SMS acknowledgement successfully', async () => {
    const ackData = {
      tenant: tenant._id,
      triggerType: 'user_created',
      smsTemplate: smsTemplate._id,
    };
    const ack = new SmsAcknowledgement(ackData);
    const savedAck = await ack.save();

    expect(savedAck._id).toBeDefined();
    expect(savedAck.tenant).toEqual(tenant._id);
    expect(savedAck.triggerType).toBe(ackData.triggerType);
    expect(savedAck.smsTemplate).toEqual(smsTemplate._id);
    expect(savedAck.status).toBe('Active');
  });

  it('should fail to create an acknowledgement without required fields', async () => {
    const ack = new SmsAcknowledgement({ tenant: tenant._id });
    let err;
    try {
      await ack.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.triggerType).toBeDefined();
    expect(err.errors.smsTemplate).toBeDefined();
  });

  it('should enforce unique triggerType per tenant', async () => {
    const ackData = {
        tenant: tenant._id,
        triggerType: 'unique_trigger',
        smsTemplate: smsTemplate._id,
    };
    const ack1 = new SmsAcknowledgement(ackData);
    await ack1.save();

    const ack2 = new SmsAcknowledgement(ackData);
    let err;
    try {
        await ack2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with an invalid status', async () => {
    const ackData = {
        tenant: tenant._id,
        triggerType: 'another_trigger',
        smsTemplate: smsTemplate._id,
        status: 'Invalid'
    };
    const ack = new SmsAcknowledgement(ackData);
    let err;
    try {
        await ack.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
