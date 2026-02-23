
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SmsTemplate = require('../../models/SmsTemplate');
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
  await SmsTemplate.deleteMany({});
  await Tenant.deleteMany({});
});

describe('SmsTemplate Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an SMS template successfully', async () => {
    const templateData = {
      tenant: tenant._id,
      name: 'Welcome Template',
      messageBody: 'Welcome, {{name}}!',
    };
    const template = new SmsTemplate(templateData);
    const savedTemplate = await template.save();

    expect(savedTemplate._id).toBeDefined();
    expect(savedTemplate.name).toBe(templateData.name);
    expect(savedTemplate.tenant).toEqual(tenant._id);
    expect(savedTemplate.messageBody).toBe(templateData.messageBody);
  });

  it('should fail to create a template without required fields', async () => {
    const template = new SmsTemplate({ tenant: tenant._id });
    let err;
    try {
      await template.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.messageBody).toBeDefined();
  });

  it('should enforce unique name per tenant', async () => {
    const templateData = {
        tenant: tenant._id,
        name: 'Unique Template',
        messageBody: 'Message 1',
    };
    const template1 = new SmsTemplate(templateData);
    await template1.save();

    const template2 = new SmsTemplate({ ...templateData, messageBody: 'Message 2' });
    let err;
    try {
        await template2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });
});
