const {
  getDashboardStats,
  getSuperAdminDashboardStats,
  getRoutersPerTenant,
  getUsersByPackage,
} = require('../../controllers/superAdminController');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');
const MikrotikUser = require('../../models/MikrotikUser');
const Transaction = require('../../models/Transaction');
const MikrotikRouter = require('../../models/MikrotikRouter');
const Package = require('../../models/Package');

jest.mock('../../models/Tenant');
jest.mock('../../models/User');
jest.mock('../../models/MikrotikUser');
jest.mock('../../models/Transaction');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../models/Package');

describe('Super Admin Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'testTenant' },
    };
    res = {
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      Tenant.countDocuments.mockResolvedValue(10);
      MikrotikUser.countDocuments.mockResolvedValue(100);
      MikrotikRouter.countDocuments.mockResolvedValue(5);
      Transaction.aggregate.mockResolvedValue([{ total: 5000 }]);

      await getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalTenants: 10,
        totalUsers: 100,
        totalRoutersOnline: 5,
        todayRevenue: 5000,
      });
    });
  });

  describe('getSuperAdminDashboardStats', () => {
    it('should return super admin dashboard stats', async () => {
        Tenant.countDocuments.mockResolvedValueOnce(10);
        Tenant.countDocuments.mockResolvedValueOnce(8);
        MikrotikRouter.countDocuments.mockResolvedValue(20);
        MikrotikUser.countDocuments.mockResolvedValue(100);

        await getSuperAdminDashboardStats(req, res);

        expect(res.json).toHaveBeenCalledWith({
            totalTenants: 10,
            activeTenants: 8,
            totalRouters: 20,
            totalUsers: 100,
        });
    });
  });

  describe('getRoutersPerTenant', () => {
    it('should return router count per tenant', async () => {
        const mockData = [{ tenantName: 'Tenant A', routerCount: 5 }];
        MikrotikRouter.aggregate.mockResolvedValue(mockData);
        await getRoutersPerTenant(req, res);
        expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });

  describe('getUsersByPackage', () => {
    it('should return user count per package', async () => {
        const mockData = [{ packageName: 'Package A', userCount: 50 }];
        MikrotikUser.aggregate.mockResolvedValue(mockData);
        await getUsersByPackage(req, res);
        expect(res.json).toHaveBeenCalledWith(mockData);
    });
  });
});
