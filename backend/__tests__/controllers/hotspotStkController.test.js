const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  initiateStkPush,
  getHotspotTransactions,
} = require('../../controllers/hotspotStkController');
const HotspotTransaction = require('../../models/HotspotTransaction');
const HotspotPlan = require('../../models/HotspotPlan');
const Tenant = require('../../models/Tenant');
const MikrotikRouter = require('../../models/MikrotikRouter');

// Mock external STK push service
jest.mock('../../services/mpesaService', () => ({
    initiateStkPushService: jest.fn()
}));
const { initiateStkPushService } = require('../../services/mpesaService');

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

describe('Hotspot STK Controller (Integration)', () => {
  let req, res, next, tenant, plan, router;

  beforeEach(async () => {
    await HotspotTransaction.deleteMany({});
    await HotspotPlan.deleteMany({});
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Hotspot STK Tenant' });
    router = await MikrotikRouter.create({
        name: 'R1',
        ipAddress: '1.1.1.1',
        apiUsername: 'a',
        apiPassword: 'p',
        tenant: tenant._id
    });
    plan = await HotspotPlan.create({
        name: '1H',
        price: 10,
        mikrotikRouter: router._id,
        tenant: tenant._id,
        timeLimitValue: 1,
        timeLimitUnit: 'hours',
        server: 'all',
        profile: 'p1'
    });

    req = {
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

  describe('initiateStkPush', () => {
    it('should create transaction and call mpesa service', async () => {
      req.body = {
        planId: plan._id.toString(),
        phoneNumber: '254700000000',
        macAddress: 'AA:BB:CC'
      };
      initiateStkPushService.mockResolvedValue({ CheckoutRequestID: '123' });

      await initiateStkPush(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const tx = await HotspotTransaction.findOne({ macAddress: 'AA:BB:CC' });
      expect(tx).toBeDefined();
      expect(tx.amount).toBe(10);
    });
  });

  describe('getHotspotTransactions', () => {
      it('should return transactions for tenant', async () => {
          await HotspotTransaction.create({
              planId: plan._id,
              phoneNumber: '123',
              macAddress: 'M1',
              amount: 10,
              tenant: tenant._id
          });

          await getHotspotTransactions(req, res, next);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
              transactions: expect.arrayContaining([
                  expect.objectContaining({ macAddress: 'M1' })
              ])
          }));
      });
  });
});
