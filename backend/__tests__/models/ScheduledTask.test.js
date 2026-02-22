
jest.unmock('mongoose');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ScheduledTask = require('../../models/ScheduledTask');
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
  await ScheduledTask.deleteMany({});
  await Tenant.deleteMany({});
});

describe('ScheduledTask Model Test', () => {
  let tenant;

  beforeEach(async () => {
    tenant = new Tenant({
      name: 'Test Tenant',
      email: 'tenant@test.com',
      password: 'password123',
    });
    await tenant.save();
  });

  it('should create & save a scheduled task successfully', async () => {
    const taskData = {
      tenant: tenant._id,
      name: 'Test Task',
      scriptPath: '/path/to/script.js',
      schedule: '0 0 * * *',
    };
    const task = new ScheduledTask(taskData);
    const savedTask = await task.save();

    expect(savedTask._id).toBeDefined();
    expect(savedTask.name).toBe(taskData.name);
    expect(savedTask.tenant).toEqual(tenant._id);
    expect(savedTask.isEnabled).toBe(true);
    expect(savedTask.lastStatus).toBe('Pending');
  });

  it('should fail to create a task without required fields', async () => {
    const task = new ScheduledTask({ tenant: tenant._id });
    let err;
    try {
      await task.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
    expect(err.errors.scriptPath).toBeDefined();
    expect(err.errors.schedule).toBeDefined();
  });

  it('should enforce unique name per tenant', async () => {
    const taskData = {
        tenant: tenant._id,
        name: 'Unique Task',
        scriptPath: '/path/to/script1.js',
        schedule: '0 1 * * *',
    };
    const task1 = new ScheduledTask(taskData);
    await task1.save();

    const task2 = new ScheduledTask({ ...taskData, scriptPath: '/path/to/script2.js' });
    let err;
    try {
        await task2.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail with an invalid lastStatus', async () => {
    const taskData = {
        tenant: tenant._id,
        name: 'Invalid Status Task',
        scriptPath: '/path/to/script.js',
        schedule: '0 0 * * *',
        lastStatus: 'Invalid'
    };
    const task = new ScheduledTask(taskData);
    let err;
    try {
        await task.save();
    } catch (error) {
        err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.lastStatus).toBeDefined();
  });
});
