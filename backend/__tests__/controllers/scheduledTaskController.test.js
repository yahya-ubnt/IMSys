const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getScheduledTasks,
  createScheduledTask,
} = require('../../controllers/scheduledTaskController');
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

describe('Scheduled Task Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await ScheduledTask.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Task Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createScheduledTask', () => {
    it('should create a task successfully', async () => {
      req.body = {
        name: 'Cleanup',
        schedule: '0 0 * * *',
        scriptPath: 'scripts/cleanup.js'
      };

      await createScheduledTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const task = await ScheduledTask.findOne({ name: 'Cleanup' });
      expect(task).toBeDefined();
    });
  });

  describe('getScheduledTasks', () => {
      it('should return tasks with nextRun calculated', async () => {
          await ScheduledTask.create({
              name: 'T1',
              schedule: '*/5 * * * *',
              scriptPath: 's1.js',
              tenant: tenant._id
          });

          await getScheduledTasks(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'T1', nextRun: expect.any(Date) })
          ]));
      });
  });
});
