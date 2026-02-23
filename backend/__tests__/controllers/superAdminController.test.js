const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getSuperAdminDashboardStats,
  getRoutersPerTenant,
} = require('../../controllers/superAdminController');
const Tenant = require('../../models/Tenant');
const MikrotikRouter = require('../../models/MikrotikRouter');

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

describe('Super Admin Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Tenant.deleteMany({});
    await MikrotikRouter.deleteMany({});

    tenant = await Tenant.create({ name: 'SA Tenant', status: 'active' });

    req = {
      params: {},
      user: { roles: ['SUPER_ADMIN'] },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getSuperAdminDashboardStats', () => {
    it('should return system-wide stats', async () => {
      await getSuperAdminDashboardStats(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          totalTenants: 1,
          activeTenants: 1
      }));
    });
  });

  describe('getRoutersPerTenant', () => {
      it('should return aggregation results', async () => {
          await MikrotikRouter.create({
              name: 'R1',
              ipAddress: '1.1.1.1',
              apiUsername: 'a',
              apiPassword: 'p',
              apiPort: 1,
              tenant: tenant._id
          });

          await getRoutersPerTenant(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ tenantName: 'SA Tenant', routerCount: 1 })
          ]));
      });
  });
});
