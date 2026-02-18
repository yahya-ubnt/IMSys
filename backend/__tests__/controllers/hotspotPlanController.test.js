const {
  createHotspotPlan,
  getHotspotPlans,
  getPublicHotspotPlans,
  getHotspotPlanById,
  updateHotspotPlan,
  deleteHotspotPlan,
} = require('../../controllers/hotspotPlanController');
const HotspotPlan = require('../../models/HotspotPlan');
const MikrotikRouter = require('../../models/MikrotikRouter');

jest.mock('../../models/HotspotPlan');
jest.mock('../../models/MikrotikRouter');

describe('HotspotPlan Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testPlanId' },
      user: { tenant: 'testTenant' },
      body: {},
      query: {},
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

  describe('createHotspotPlan', () => {
    it('should create a hotspot plan', async () => {
      const planData = {
        name: 'Test Plan',
        price: 100,
        mikrotikRouter: 'router1',
        timeLimitValue: 1,
        timeLimitUnit: 'hour',
        server: 'server1',
        profile: 'profile1',
        rateLimit: '1M/1M',
        dataLimitValue: 1,
        dataLimitUnit: 'GB',
        sharedUsers: 1,
        validDays: 30,
        showInCaptivePortal: true,
      };
      req.body = planData;
      HotspotPlan.prototype.save = jest.fn().mockResolvedValue({ ...planData, tenant: 'testTenant' });

      await createHotspotPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(planData));
    });

    it('should return 400 if an error occurs', async () => {
      req.body = {};
      HotspotPlan.prototype.save = jest.fn().mockRejectedValue(new Error('Validation failed'));

      await createHotspotPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });
  });

  describe('getHotspotPlans', () => {
    it('should return all hotspot plans for a tenant', async () => {
      const plans = [{ name: 'Plan 1' }, { name: 'Plan 2' }];
      HotspotPlan.find.mockReturnThis();
      HotspotPlan.populate.mockResolvedValue(plans);

      await getHotspotPlans(req, res);

      expect(HotspotPlan.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(plans);
    });

    it('should return 500 if an error occurs', async () => {
      HotspotPlan.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getHotspotPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('getPublicHotspotPlans', () => {
    it('should return public hotspot plans for a given router IP', async () => {
      req.query.router_ip = '192.168.1.1';
      const mockRouter = { _id: 'routerId', ipAddress: '192.168.1.1' };
      const publicPlans = [{ name: 'Public Plan 1' }];
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      HotspotPlan.find.mockResolvedValue(publicPlans);

      await getPublicHotspotPlans(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ ipAddress: '192.168.1.1' });
      expect(HotspotPlan.find).toHaveBeenCalledWith({ mikrotikRouter: 'routerId', showInCaptivePortal: true });
      expect(res.json).toHaveBeenCalledWith(publicPlans);
    });

    it('should return 400 if router_ip is missing', async () => {
      req.query.router_ip = undefined;

      await getPublicHotspotPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Router IP address is required' });
    });

    it('should return 404 if router not found', async () => {
      req.query.router_ip = '192.168.1.1';
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getPublicHotspotPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Router not found' });
    });

    it('should handle router_ip with port number', async () => {
      req.query.router_ip = '192.168.1.1:8080';
      const mockRouter = { _id: 'routerId', ipAddress: '192.168.1.1' };
      const publicPlans = [{ name: 'Public Plan 1' }];
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      HotspotPlan.find.mockResolvedValue(publicPlans);

      await getPublicHotspotPlans(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ ipAddress: '192.168.1.1' });
      expect(res.json).toHaveBeenCalledWith(publicPlans);
    });
  });

  describe('getHotspotPlanById', () => {
    it('should return a single hotspot plan', async () => {
      const plan = { _id: 'testPlanId', name: 'Test Plan', tenant: 'testTenant' };
      HotspotPlan.findById.mockResolvedValue(plan);

      await getHotspotPlanById(req, res);

      expect(HotspotPlan.findById).toHaveBeenCalledWith('testPlanId');
      expect(res.json).toHaveBeenCalledWith(plan);
    });

    it('should return 404 if plan not found', async () => {
      HotspotPlan.findById.mockResolvedValue(null);

      await getHotspotPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
    });

    it('should return 404 if plan belongs to another tenant', async () => {
      const plan = { _id: 'testPlanId', name: 'Test Plan', tenant: 'otherTenant' };
      HotspotPlan.findById.mockResolvedValue(plan);

      await getHotspotPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
    });
  });

  describe('updateHotspotPlan', () => {
    it('should update a hotspot plan', async () => {
      const mockPlan = {
        _id: 'testPlanId',
        name: 'Old Name',
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({ _id: 'testPlanId', name: 'New Name', tenant: 'testTenant' }),
      };
      HotspotPlan.findById.mockResolvedValue(mockPlan);
      req.body = { name: 'New Name' };

      await updateHotspotPlan(req, res);

      expect(mockPlan.name).toBe('New Name');
      expect(mockPlan.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
    });

    it('should return 404 if plan not found', async () => {
      HotspotPlan.findById.mockResolvedValue(null);

      await updateHotspotPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
    });

    it('should return 404 if plan belongs to another tenant', async () => {
      const plan = { _id: 'testPlanId', name: 'Test Plan', tenant: 'otherTenant' };
      HotspotPlan.findById.mockResolvedValue(plan);

      await updateHotspotPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
    });
  });

  describe('deleteHotspotPlan', () => {
    it('should delete a hotspot plan', async () => {
      const mockPlan = {
        _id: 'testPlanId',
        tenant: 'testTenant',
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      HotspotPlan.findById.mockResolvedValue(mockPlan);

      await deleteHotspotPlan(req, res);

      expect(mockPlan.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan removed' });
    });

    it('should return 404 if plan not found', async () => {
      HotspotPlan.findById.mockResolvedValue(null);

      await deleteHotspotPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
    });

    it('should return 404 if plan belongs to another tenant', async () => {
      const plan = { _id: 'testPlanId', tenant: 'otherTenant' };
      HotspotPlan.findById.mockResolvedValue(plan);

      await deleteHotspotPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
    });
  });
});