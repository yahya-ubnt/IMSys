const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createMikrotikRouter,
  getMikrotikRouters,
} = require('../../controllers/mikrotikRouterController');
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

describe('Mikrotik Router Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Router Tenant' });

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

  describe('createMikrotikRouter', () => {
    it('should create a router successfully', async () => {
      req.body = {
        name: 'Main Router',
        ipAddress: '10.0.0.1',
        apiUsername: 'admin',
        apiPassword: 'password123',
        apiPort: 8728
      };

      await createMikrotikRouter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const router = await MikrotikRouter.findOne({ name: 'Main Router' });
      expect(router).toBeDefined();
      expect(router.apiPassword).not.toBe('password123'); // Should be encrypted
    });
  });

  describe('getMikrotikRouters', () => {
      it('should return all routers for tenant', async () => {
          await MikrotikRouter.create({
              name: 'R1',
              ipAddress: '1.1.1.1',
              apiUsername: 'a',
              apiPassword: 'p',
              apiPort: 1,
              tenant: tenant._id
          });

          await getMikrotikRouters(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'R1' })
          ]));
      });
  });
});
