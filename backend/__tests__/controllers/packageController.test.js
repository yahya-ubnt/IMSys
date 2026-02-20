const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../../controllers/packageController');
const Package = require('../../models/Package');
const MikrotikRouter = require('../../models/MikrotikRouter');
const mongoose = require('mongoose');

jest.mock('../../models/Package');
jest.mock('../../models/MikrotikRouter');

describe('Package Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testPackageId' },
      user: { tenant: 'testTenant' },
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

  describe('createPackage', () => {
    it('should create a new PPPoE package', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const packageData = {
        mikrotikRouter: routerId,
        serviceType: 'pppoe',
        name: 'PPPoE Basic',
        price: 100,
        status: 'Active',
        profile: 'default',
      };
      req.body = packageData;
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });
      Package.findOne.mockResolvedValue(null);
      Package.create.mockResolvedValue({ _id: 'newPackageId', ...packageData, tenant: 'testTenant' });

      await createPackage(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: routerId, tenant: 'testTenant' });
      expect(Package.findOne).toHaveBeenCalledWith({ mikrotikRouter: routerId, serviceType: 'pppoe', name: 'PPPoE Basic', tenant: 'testTenant' });
      expect(Package.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'PPPoE Basic' }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'PPPoE Basic' }));
    });

    it('should create a new Static package', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const packageData = {
        mikrotikRouter: routerId,
        serviceType: 'static',
        name: 'Static Basic',
        price: 150,
        status: 'Active',
        rateLimit: '1M/1M',
      };
      req.body = packageData;
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });
      Package.findOne.mockResolvedValue(null);
      Package.create.mockResolvedValue({ _id: 'newPackageId', ...packageData, tenant: 'testTenant' });

      await createPackage(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: routerId, tenant: 'testTenant' });
      expect(Package.findOne).toHaveBeenCalledWith({ mikrotikRouter: routerId, serviceType: 'static', name: 'Static Basic', tenant: 'testTenant' });
      expect(Package.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Static Basic' }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Static Basic' }));
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { name: 'Test Package' }; // Missing mikrotikRouter, serviceType, price, status

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Please add all required fields: mikrotikRouter, serviceType, name, price, status'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 404 if Mikrotik Router not found', async () => {
      req.body = { mikrotikRouter: new mongoose.Types.ObjectId(), serviceType: 'pppoe', name: 'Test', price: 100, status: 'Active', profile: 'default' };
      MikrotikRouter.findOne.mockResolvedValue(null);

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Mikrotik Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 for PPPoE package without profile', async () => {
      const routerId = new mongoose.Types.ObjectId();
      req.body = { mikrotikRouter: routerId, serviceType: 'pppoe', name: 'Test', price: 100, status: 'Active' }; // Missing profile
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('For PPPoE packages, profile is required'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 for PPPoE package with rateLimit', async () => {
      const routerId = new mongoose.Types.ObjectId();
      req.body = { mikrotikRouter: routerId, serviceType: 'pppoe', name: 'Test', price: 100, status: 'Active', profile: 'default', rateLimit: '1M/1M' };
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('PPPoE packages cannot have a rateLimit'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 for Static package without rateLimit', async () => {
      const routerId = new mongoose.Types.ObjectId();
      req.body = { mikrotikRouter: routerId, serviceType: 'static', name: 'Test', price: 100, status: 'Active' }; // Missing rateLimit
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('For Static packages, rateLimit is required'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 for Static package with profile', async () => {
      const routerId = new mongoose.Types.ObjectId();
      req.body = { mikrotikRouter: routerId, serviceType: 'static', name: 'Test', price: 100, status: 'Active', profile: 'default', rateLimit: '1M/1M' };
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Static packages cannot have a profile'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 if package with same name, router, and service type already exists', async () => {
      const routerId = new mongoose.Types.ObjectId();
      req.body = { mikrotikRouter: routerId, serviceType: 'pppoe', name: 'Existing Package', price: 100, status: 'Active', profile: 'default' };
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });
      Package.findOne.mockResolvedValue(true);

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('A package with this name, router, and service type already exists'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 if invalid package data', async () => {
      const routerId = new mongoose.Types.ObjectId();
      req.body = { mikrotikRouter: routerId, serviceType: 'pppoe', name: 'Test', price: 100, status: 'Active', profile: 'default' };
      MikrotikRouter.findOne.mockResolvedValue({ _id: routerId, tenant: 'testTenant' });
      Package.findOne.mockResolvedValue(null);
      Package.create.mockResolvedValue(null);

      await createPackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Invalid package data'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('getPackages', () => {
    it('should return all packages for a tenant', async () => {
      const packages = [{ name: 'Package 1' }, { name: 'Package 2' }];
      Package.find.mockReturnThis();
      Package.populate.mockResolvedValue(packages);

      await getPackages(req, res);

      expect(Package.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(packages);
    });
  });

  describe('getPackageById', () => {
    it('should return a single package by ID', async () => {
      const singlePackage = { _id: 'testPackageId', name: 'Test Package', tenant: 'testTenant' };
      Package.findOne.mockReturnThis();
      Package.populate.mockResolvedValue(singlePackage);

      await getPackageById(req, res);

      expect(Package.findOne).toHaveBeenCalledWith({ _id: 'testPackageId', tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(singlePackage);
    });

    it('should return 404 if package not found', async () => {
      Package.findOne.mockReturnThis();
      Package.populate.mockResolvedValue(null);

      await getPackageById(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Package not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('updatePackage', () => {
    it('should update a PPPoE package', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const mockPackage = {
        _id: 'testPackageId',
        mikrotikRouter: routerId,
        serviceType: 'pppoe',
        name: 'Old PPPoE',
        price: 100,
        status: 'Active',
        profile: 'old_profile',
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({ name: 'New PPPoE', profile: 'new_profile', serviceType: 'pppoe' }),
      };
      req.body = { name: 'New PPPoE', profile: 'new_profile' };
      Package.findOne.mockResolvedValue(mockPackage);

      await updatePackage(req, res);

      expect(mockPackage.name).toBe('New PPPoE');
      expect(mockPackage.profile).toBe('new_profile');
      expect(mockPackage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'New PPPoE' }));
    });

    it('should update a Static package', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const mockPackage = {
        _id: 'testPackageId',
        mikrotikRouter: routerId,
        serviceType: 'static',
        name: 'Old Static',
        price: 100,
        status: 'Active',
        rateLimit: 'old_rate',
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({ name: 'New Static', rateLimit: 'new_rate', serviceType: 'static' }),
      };
      req.body = { name: 'New Static', rateLimit: 'new_rate' };
      Package.findOne.mockResolvedValue(mockPackage);

      await updatePackage(req, res);

      expect(mockPackage.name).toBe('New Static');
      expect(mockPackage.rateLimit).toBe('new_rate');
      expect(mockPackage.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Static' }));
    });

    it('should return 404 if package not found', async () => {
      Package.findOne.mockResolvedValue(null);

      await updatePackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Package not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 404 if new Mikrotik Router not found', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const newRouterId = new mongoose.Types.ObjectId();
      const mockPackage = {
        _id: 'testPackageId',
        mikrotikRouter: routerId,
        serviceType: 'pppoe',
        name: 'Old PPPoE',
        price: 100,
        status: 'Active',
        profile: 'old_profile',
        tenant: 'testTenant',
        save: jest.fn(),
      };
      req.body = { mikrotikRouter: newRouterId };
      Package.findOne.mockResolvedValue(mockPackage);
      MikrotikRouter.findOne.mockResolvedValue(null);

      await updatePackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Mikrotik Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 for PPPoE package without profile on update', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const mockPackage = {
        _id: 'testPackageId',
        mikrotikRouter: routerId,
        serviceType: 'pppoe',
        name: 'Old PPPoE',
        price: 100,
        status: 'Active',
        profile: undefined, // Simulate missing profile
        tenant: 'testTenant',
        save: jest.fn(),
      };
      req.body = { name: 'New PPPoE' }; // No profile provided
      Package.findOne.mockResolvedValue(mockPackage);

      await updatePackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('For PPPoE packages, profile is required'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 for Static package without rateLimit on update', async () => {
      const routerId = new mongoose.Types.ObjectId();
      const mockPackage = {
        _id: 'testPackageId',
        mikrotikRouter: routerId,
        serviceType: 'static',
        name: 'Old Static',
        price: 100,
        status: 'Active',
        rateLimit: undefined, // Simulate missing rateLimit
        tenant: 'testTenant',
        save: jest.fn(),
      };
      req.body = { name: 'New Static' }; // No rateLimit provided
      Package.findOne.mockResolvedValue(mockPackage);

      await updatePackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('For Static packages, rateLimit is required'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('deletePackage', () => {
    it('should delete a package', async () => {
      const mockPackage = { _id: 'testPackageId', tenant: 'testTenant', deleteOne: jest.fn().mockResolvedValue({}) };
      Package.findOne.mockResolvedValue(mockPackage);

      await deletePackage(req, res);

      expect(Package.findOne).toHaveBeenCalledWith({ _id: 'testPackageId', tenant: 'testTenant' });
      expect(mockPackage.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Package removed' });
    });

    it('should return 404 if package not found', async () => {
      Package.findOne.mockResolvedValue(null);

      await deletePackage(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Package not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });
});