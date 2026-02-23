const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  searchEntities,
} = require('../../controllers/searchController');
const MikrotikUser = require('../../models/MikrotikUser');
const Device = require('../../models/Device');
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

describe('Search Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await MikrotikUser.deleteMany({});
    await Device.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Search Tenant' });

    req = {
      query: { q: 'test' },
      user: { tenant: tenant._id },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('searchEntities', () => {
    it('should return matched users and devices', async () => {
      await MikrotikUser.create({
        officialName: 'Test User',
        username: 'testuser',
        email: 't@t.com',
        phone: '1',
        mPesaRefNo: 'R1',
        serviceType: 'pppoe',
        package: new mongoose.Types.ObjectId(),
        mikrotikRouter: new mongoose.Types.ObjectId(),
        tenant: tenant._id,
        billingCycle: 'Monthly',
        mobileNumber: '1',
        expiryDate: new Date()
      });

      await Device.create({
          deviceName: 'Test Antena',
          deviceType: 'Station',
          ipAddress: '1.1.1.1',
          macAddress: 'AA',
          router: new mongoose.Types.ObjectId(),
          tenant: tenant._id
      });

      await searchEntities(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ type: 'User' }),
          expect.objectContaining({ type: 'Station' })
      ]));
    });
  });
});
