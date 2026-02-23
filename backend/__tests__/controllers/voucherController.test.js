const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  generateVouchers,
  getVouchers,
} = require('../../controllers/voucherController');
const Voucher = require('../../models/Voucher');
const MikrotikRouter = require('../../models/MikrotikRouter');
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

describe('Voucher Controller (Integration)', () => {
  let req, res, next, tenant, router;

  beforeEach(async () => {
    await Voucher.deleteMany({});
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Voucher Tenant' });
    router = await MikrotikRouter.create({
        name: 'R1',
        ipAddress: '1.1.1.1',
        apiUsername: 'a',
        apiPassword: 'p',
        tenant: tenant._id,
        apiPort: 1
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

  describe('generateVouchers', () => {
    it('should generate batch of vouchers', async () => {
      req.body = {
        quantity: 5,
        nameLength: 6,
        price: 10,
        mikrotikRouter: router._id.toString(),
        server: 'all',
        profile: 'default',
        timeLimitValue: 1,
        timeLimitUnit: 'hours'
      };

      await generateVouchers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const vouchers = await Voucher.find({ tenant: tenant._id });
      expect(vouchers.length).toBe(5);
    });
  });

  describe('getVouchers', () => {
      it('should return all vouchers for tenant', async () => {
          await Voucher.create({
              username: '123456',
              password: 'p1',
              profile: 'default',
              price: 10,
              tenant: tenant._id,
              mikrotikRouter: router._id,
              batch: 'b1',
              status: 'active'
          });

          await getVouchers(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ username: '123456' })
          ]));
      });
  });
});
