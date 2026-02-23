const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createSchedule,
  getSchedules,
} = require('../../controllers/smsExpiryScheduleController');
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

describe('SMS Expiry Schedule Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await SmsExpirySchedule.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Expiry Tenant' });

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

  describe('createSchedule', () => {
    it('should create schedule successfully', async () => {
      req.body = {
        name: '3 Days Before',
        days: 3,
        timing: 'Before',
        messageBody: 'Your sub expires in 3 days',
        status: 'Active'
      };

      await createSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const s = await SmsExpirySchedule.findOne({ name: '3 Days Before' });
      expect(s).toBeDefined();
    });
  });

  describe('getSchedules', () => {
      it('should return all schedules for tenant', async () => {
          await SmsExpirySchedule.create({
              name: 'S1',
              days: 1,
              timing: 'After',
              messageBody: 'Body',
              tenant: tenant._id,
              status: 'Active'
          });

          await getSchedules(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'S1' })
          ]));
      });
  });
});
