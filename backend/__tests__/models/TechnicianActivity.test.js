
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const TechnicianActivity = require('../../models/TechnicianActivity');
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
  await TechnicianActivity.deleteMany({});
  await Tenant.deleteMany({});
});

describe('TechnicianActivity Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save an Installation activity successfully', async () => {
    const activityData = {
      tenant: tenant._id,
      technician: 'Tech Tom',
      activityType: 'Installation',
      clientName: 'John Doe',
      clientPhone: '1234567890',
      activityDate: new Date(),
      description: 'New client setup',
      installedEquipment: 'Router, ONU',
      installationNotes: 'Signal strength is good.',
    };
    const activity = new TechnicianActivity(activityData);
    const savedActivity = await activity.save();

    expect(savedActivity._id).toBeDefined();
    expect(savedActivity.activityType).toBe('Installation');
    expect(savedActivity.installedEquipment).toBe(activityData.installedEquipment);
  });

  it('should create & save a Support activity successfully', async () => {
    const activityData = {
        tenant: tenant._id,
        technician: 'Tech Jane',
        activityType: 'Support',
        clientName: 'Jane Smith',
        clientPhone: '0987654321',
        activityDate: new Date(),
        description: 'Client connectivity issue',
        supportCategory: 'Client Problem',
        issueDescription: 'No internet connection',
        solutionProvided: 'Replaced faulty cable',
    };
    const activity = new TechnicianActivity(activityData);
    const savedActivity = await activity.save();

    expect(savedActivity._id).toBeDefined();
    expect(savedActivity.activityType).toBe('Support');
    expect(savedActivity.issueDescription).toBe(activityData.issueDescription);
  });

  it('should fail if required fields for Installation are missing', async () => {
    const activity = new TechnicianActivity({
        tenant: tenant._id,
        technician: 'Tech Tom',
        activityType: 'Installation',
        clientName: 'John Doe',
        clientPhone: '1234567890',
        activityDate: new Date(),
        description: 'New client setup',
    });
    let err;
    try {
      await activity.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.installedEquipment).toBeDefined();
    expect(err.errors.installationNotes).toBeDefined();
  });

  it('should fail if required fields for Support are missing', async () => {
    const activity = new TechnicianActivity({
        tenant: tenant._id,
        technician: 'Tech Jane',
        activityType: 'Support',
        clientName: 'Jane Smith',
        clientPhone: '0987654321',
        activityDate: new Date(),
        description: 'Client connectivity issue',
    });
    let err;
    try {
        await activity.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.supportCategory).toBeDefined();
    expect(err.errors.issueDescription).toBeDefined();
    expect(err.errors.solutionProvided).toBeDefined();
  });

  it('should fail with an invalid phone number', async () => {
    const activityData = {
        tenant: tenant._id,
        technician: 'Tech Tom',
        activityType: 'Installation',
        clientName: 'John Doe',
        clientPhone: 'invalid-phone',
        activityDate: new Date(),
        description: 'New client setup',
        installedEquipment: 'Router, ONU',
        installationNotes: 'Signal strength is good.',
    };
    const activity = new TechnicianActivity(activityData);
    let err;
    try {
        await activity.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.clientPhone).toBeDefined();
  });
});
