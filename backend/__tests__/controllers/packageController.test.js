const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createPackage,
  getPackages,
} = require('../../controllers/packageController');
const Package = require('../../models/Package');
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

describe('Package Controller (Integration)', () => {
  let req, res, next, tenant, router;

  beforeEach(async () => {
    await Package.deleteMany({});
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Package Tenant' });
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

  describe('createPackage', () => {
    it('should create a PPPoE package successfully', async () => {
      req.body = {
        mikrotikRouter: router._id.toString(),
        serviceType: 'pppoe',
        name: 'Gold',
        price: 3000,
        status: 'active',
        profile: 'gold_profile'
      };

      await createPackage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const pkg = await Package.findOne({ name: 'Gold' });
      expect(pkg).toBeDefined();
    });

    it('should throw error if profile missing for PPPoE', async () => {
        req.body = {
            mikrotikRouter: router._id.toString(),
            serviceType: 'pppoe',
            name: 'Gold',
            price: 3000,
            status: 'active'
        };

        await createPackage(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPackages', () => {
      it('should return all packages for tenant', async () => {
          await Package.create({
              name: 'P1',
              price: 10,
              serviceType: 'pppoe',
              status: 'active',
              profile: 'p1',
              mikrotikRouter: router._id,
              tenant: tenant._id
          });

          await getPackages(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'P1' })
          ]));
      });
  });
});
