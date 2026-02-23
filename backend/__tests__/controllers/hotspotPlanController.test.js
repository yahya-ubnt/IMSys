const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createHotspotPlan,
  getHotspotPlans,
  getHotspotPlanById,
  updateHotspotPlan,
  deleteHotspotPlan,
} = require('../../controllers/hotspotPlanController');
const HotspotPlan = require('../../models/HotspotPlan');
const MikrotikRouter = require('../../models/MikrotikRouter');
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

describe('Hotspot Plan Controller (Integration)', () => {
  let req, res, next, tenant, router;

  beforeEach(async () => {
    await HotspotPlan.deleteMany({});
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Hotspot Tenant' });
    router = await MikrotikRouter.create({
        name: 'Hotspot Router',
        ipAddress: '1.1.1.1',
        apiUsername: 'a',
        apiPassword: 'p',
        tenant: tenant._id
    });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createHotspotPlan', () => {
    it('should create a hotspot plan successfully', async () => {
      req.body = {
        name: '1 Hour',
        price: 20,
        mikrotikRouter: router._id,
        timeLimitValue: 1,
        timeLimitUnit: 'hours',
        server: 'all',
        profile: 'hsprof1'
      };

      await createHotspotPlan(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const plan = await HotspotPlan.findOne({ name: '1 Hour' });
      expect(plan).toBeDefined();
    });
  });

  describe('getHotspotPlans', () => {
    it('should return all plans for the tenant', async () => {
      await HotspotPlan.create({
        name: 'Plan 1',
        price: 10,
        mikrotikRouter: router._id,
        tenant: tenant._id,
        timeLimitValue: 1,
        timeLimitUnit: 'days',
        server: 'all',
        profile: 'p1'
      });

      await getHotspotPlans(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ name: 'Plan 1' })
      ]));
    });
  });
});
