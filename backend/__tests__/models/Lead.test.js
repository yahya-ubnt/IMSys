
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Lead = require('../../models/Lead');
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
  await Lead.deleteMany({});
  await Tenant.deleteMany({});
});

describe('Lead Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a lead successfully', async () => {
    const leadData = {
      tenant: tenant._id,
      phoneNumber: '1234567890',
      leadSource: 'Website',
    };
    const lead = new Lead(leadData);
    const savedLead = await lead.save();

    expect(savedLead._id).toBeDefined();
    expect(savedLead.tenant).toEqual(tenant._id);
    expect(savedLead.phoneNumber).toBe(leadData.phoneNumber);
    expect(savedLead.leadSource).toBe(leadData.leadSource);
    expect(savedLead.status).toBe('New');
  });

  it('should fail to create a lead without a tenant', async () => {
    const lead = new Lead({
        phoneNumber: '1234567890',
        leadSource: 'Website',
    });
    let err;
    try {
      await lead.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.tenant).toBeDefined();
  });

  it('should fail to create a lead without a phoneNumber', async () => {
    const lead = new Lead({
        tenant: tenant._id,
        leadSource: 'Website',
    });
    let err;
    try {
      await lead.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.phoneNumber).toBeDefined();
  });

  it('should fail to create a lead without a leadSource', async () => {
    const lead = new Lead({
        tenant: tenant._id,
        phoneNumber: '1234567890',
    });
    let err;
    try {
      await lead.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.leadSource).toBeDefined();
  });

  it('should enforce the unique compound index on tenant and phoneNumber', async () => {
    const leadData = {
        tenant: tenant._id,
        phoneNumber: '1234567890',
        leadSource: 'Website',
    };
    const lead1 = new Lead(leadData);
    await lead1.save();

    const lead2 = new Lead(leadData);
    let err;
    try {
        await lead2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with an invalid leadSource', async () => {
    const lead = new Lead({
        tenant: tenant._id,
        phoneNumber: '1234567890',
        leadSource: 'Invalid Source',
    });
    let err;
    try {
        await lead.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.leadSource).toBeDefined();
  });

  it('should fail with an invalid status', async () => {
    const lead = new Lead({
        tenant: tenant._id,
        phoneNumber: '1234567890',
        leadSource: 'Website',
        status: 'Invalid Status'
    });
    let err;
    try {
        await lead.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.status).toBeDefined();
  });
});
