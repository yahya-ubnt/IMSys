const {
  getTenantStats,
  getMonthlyTenantGrowth,
  getTenants,
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
} = require('../../controllers/tenantController');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');
const scheduledTaskService = require('../../services/scheduledTaskService');

jest.mock('../../models/Tenant');
jest.mock('../../models/User');
jest.mock('../../services/scheduledTaskService');

describe('Tenant Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId', year: '2024' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantStats', () => {
    it('should return tenant stats', async () => {
      Tenant.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(8).mockResolvedValueOnce(2);
      await getTenantStats(req, res);
      expect(res.json).toHaveBeenCalledWith({ totalTenants: 10, activeTenants: 8, suspendedTenants: 2 });
    });
  });

  describe('getMonthlyTenantGrowth', () => {
    it('should return monthly tenant growth', async () => {
      Tenant.aggregate.mockResolvedValue([{ _id: 1, count: 5 }]);
      await getMonthlyTenantGrowth(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getTenants', () => {
    it('should return all tenants', async () => {
      const mockTenants = [{ _id: 't1' }];
      Tenant.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockTenants) });
      await getTenants(req, res);
      expect(res.json).toHaveBeenCalledWith(mockTenants);
    });
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      req.body = { tenantName: 'New Tenant', fullName: 'Admin', email: 'admin@test.com', password: 'password', phone: '123' };
      Tenant.findOne.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);
      const mockTenant = { _id: 't1', save: jest.fn() };
      Tenant.create.mockResolvedValue(mockTenant);
      const mockUser = { _id: 'u1' };
      User.create.mockResolvedValue(mockUser);
      scheduledTaskService.createDefaultTasksForTenant.mockResolvedValue(true);

      await createTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getTenantById', () => {
    it('should return a single tenant', async () => {
      const mockTenant = { _id: 't1' };
      Tenant.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockTenant) });
      await getTenantById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockTenant);
    });
  });

  describe('updateTenant', () => {
    it('should update a tenant', async () => {
        const mockTenant = { _id: 't1', owner: 'u1', save: jest.fn().mockResolvedValue({_id: 't1'}) };
        const mockUser = { _id: 'u1', save: jest.fn() };
        Tenant.findById.mockResolvedValue(mockTenant);
        User.findById.mockResolvedValue(mockUser);
        
        // This mock is for the final populate call
        const finalPopulatedTenant = { ...mockTenant, owner: { fullName: 'Admin' } };
        Tenant.findById.mockReturnValueOnce(mockTenant).mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(finalPopulatedTenant) });


        req.body = { name: 'Updated Tenant' };

        await updateTenant(req, res, next);

        expect(mockTenant.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(finalPopulatedTenant);
    });
  });

  describe('deleteTenant', () => {
    it('should delete a tenant', async () => {
      const mockTenant = { _id: 't1', deleteOne: jest.fn() };
      Tenant.findById.mockResolvedValue(mockTenant);
      await deleteTenant(req, res, next);
      expect(mockTenant.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Tenant and all associated data removed' });
    });
  });
});
