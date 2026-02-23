const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createHotspotUser,
  getHotspotUsers,
} = require('../../controllers/hotspotUserController');
const HotspotUser = require('../../models/HotspotUser');
const MikrotikRouter = require('../../models/MikrotikRouter');
const HotspotPlan = require('../../models/HotspotPlan');
const Tenant = require('../../models/Tenant');

// Mock Mikrotik Utils
jest.mock('../../utils/mikrotikUtils', () => ({
    addHotspotUser: jest.fn().mockResolvedValue(true),
    removeHotspotUser: jest.fn().mockResolvedValue(true)
}));

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

describe('Hotspot User Controller (Integration)', () => {
  let req, res, next, tenant, router, plan;

  beforeEach(async () => {
    await HotspotUser.deleteMany({});
    await HotspotPlan.deleteMany({});
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Hotspot User Tenant' });
    router = await MikrotikRouter.create({
        name: 'R1',
        ipAddress: '1.1.1.1',
        apiUsername: 'a',
        apiPassword: 'p',
        tenant: tenant._id
    });
    plan = await HotspotPlan.create({
        name: 'Plan 1',
        price: 100,
        mikrotikRouter: router._id,
        tenant: tenant._id,
        timeLimitValue: 1,
        timeLimitUnit: 'days',
        server: 'all',
        profile: 'p1'
    });

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

  const getValidReqBody = () => ({
    officialName: 'John',
    hotspotName: 'john_hsp',
    hotspotPassword: 'pass',
    hotspotPackage: plan._id.toString(), // For the controller
    mikrotikRouter: router._id.toString(),
    server: 'all',
    profile: 'default',
    referenceNumber: 'REF1',
    billAmount: 100,
    billingCycleValue: 1,
    billingCycleUnit: 'months',
    phoneNumber: '123',
    expiryDate: new Date(),
    expiryTime: '23:59'
  });

  describe('createHotspotUser', () => {
    it('should create hotspot user successfully', async () => {
      req.body = getValidReqBody();

      await createHotspotUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const user = await HotspotUser.findOne({ hotspotName: 'john_hsp' });
      expect(user).toBeDefined();
    });
  });

  describe('getHotspotUsers', () => {
      it('should return all users for tenant', async () => {
          const body = getValidReqBody();
          // Convert body to model format
          const modelData = { ...body, package: body.hotspotPackage, tenant: tenant._id };
          delete modelData.hotspotPackage;
          
          await HotspotUser.create(modelData);

          await getHotspotUsers(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ hotspotName: 'john_hsp' })
          ]));
      });
  });
});
