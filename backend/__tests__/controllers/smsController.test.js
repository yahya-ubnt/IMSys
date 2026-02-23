const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getSmsTriggers,
} = require('../../controllers/smsController');
const Tenant = require('../../models/Tenant');

// Mock smsService
jest.mock('../../services/smsService');
const smsService = require('../../services/smsService');

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

describe('SMS Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Tenant.deleteMany({});
    tenant = await Tenant.create({ name: 'SMS Tenant' });

    req = {
      user: { tenant: tenant._id },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getSmsTriggers', () => {
    it('should return available triggers', async () => {
      await getSmsTriggers(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ name: expect.any(String) })
      ]));
    });
  });
});
