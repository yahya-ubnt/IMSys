const {
  createMikrotikRouter,
  getMikrotikRouters,
  getMikrotikRouterById,
  updateMikrotikRouter,
  deleteMikrotikRouter,
  testMikrotikConnection,
  getMikrotikPppProfiles,
  getMikrotikPppServices,
  getMikrotikRouterStatus,
  getHotspotServers,
  getHotspotProfiles,
} = require('../../controllers/mikrotikRouterController');
const MikrotikRouter = require('../../models/MikrotikRouter');
const MikrotikUser = require('../../models/MikrotikUser');
const { encrypt, decrypt } = require('../../utils/crypto');
const mikrotikUtils = require('../../utils/mikrotikUtils');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

jest.mock('../../models/MikrotikRouter');
jest.mock('../../models/MikrotikUser');
jest.mock('../../utils/crypto');
jest.mock('../../utils/mikrotikUtils');
jest.mock('node-routeros');

describe('MikrotikRouter Controller', () => {
  let req, res, next;
  let mockRouterOSAPIInstance;

  beforeEach(() => {
    mockRouterOSAPIInstance = {
      connect: jest.fn().mockResolvedValue(true),
      write: jest.fn().mockResolvedValue([]),
      close: jest.fn(),
      connected: true,
    };
    RouterOSAPI.mockImplementation(() => mockRouterOSAPIInstance);

    req = {
      params: { id: 'testRouterId' },
      user: { tenant: 'testTenant', roles: ['ADMIN'] },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    encrypt.mockImplementation((password) => `encrypted_${password}`);
    decrypt.mockImplementation((encryptedPassword) => encryptedPassword.replace('encrypted_', ''));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMikrotikRouter', () => {
    it('should create a new Mikrotik router', async () => {
      const routerData = {
        name: 'Test Router',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        apiPort: 8728,
        location: 'Test Location',
      };
      req.body = routerData;
      MikrotikRouter.findOne.mockResolvedValue(null);
      MikrotikRouter.create.mockResolvedValue({
        _id: 'newRouterId',
        ...routerData,
        apiPassword: 'encrypted_password',
        tenant: 'testTenant',
      });

      await createMikrotikRouter(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ ipAddress: '192.168.1.1', tenant: 'testTenant' });
      expect(encrypt).toHaveBeenCalledWith('password');
      expect(MikrotikRouter.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Router',
        apiPassword: 'encrypted_password',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Router' }));
    });

    it('should return 400 if required fields are missing', async () => {
      req.body = { name: 'Test Router' }; // Missing other fields

      await createMikrotikRouter(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Please add all required fields'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 if router with IP already exists', async () => {
      req.body = {
        name: 'Test Router',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        apiPort: 8728,
      };
      MikrotikRouter.findOne.mockResolvedValue(true);

      await createMikrotikRouter(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Router with this IP address already exists for this tenant'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 if invalid router data', async () => {
      req.body = {
        name: 'Test Router',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        apiPort: 8728,
      };
      MikrotikRouter.findOne.mockResolvedValue(null);
      MikrotikRouter.create.mockResolvedValue(null); // Simulate invalid data

      await createMikrotikRouter(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Invalid router data'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('getMikrotikRouters', () => {
    it('should return all Mikrotik routers for a tenant', async () => {
      const routers = [{ name: 'Router 1' }, { name: 'Router 2' }];
      MikrotikRouter.find.mockResolvedValue(routers);

      await getMikrotikRouters(req, res);

      expect(MikrotikRouter.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(routers);
    });
  });

  describe('getMikrotikRouterById', () => {
    it('should return a single Mikrotik router', async () => {
      const router = { _id: 'testRouterId', name: 'Test Router', tenant: 'testTenant' };
      MikrotikRouter.findOne.mockResolvedValue(router);

      await getMikrotikRouterById(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'testRouterId', tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(router);
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getMikrotikRouterById(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('updateMikrotikRouter', () => {
    it('should update a Mikrotik router', async () => {
      const mockRouter = {
        _id: 'testRouterId',
        name: 'Old Name',
        apiPassword: 'encrypted_old_password',
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({
          _id: 'testRouterId',
          name: 'New Name',
          ipAddress: '192.168.1.2',
          apiUsername: 'newadmin',
          apiPassword: 'encrypted_new_password',
          apiPort: 8729,
          location: 'New Location',
        }),
      };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      req.body = {
        name: 'New Name',
        ipAddress: '192.168.1.2',
        apiUsername: 'newadmin',
        apiPassword: 'newpassword',
        apiPort: 8729,
        location: 'New Location',
      };

      await updateMikrotikRouter(req, res);

      expect(mockRouter.name).toBe('New Name');
      expect(mockRouter.apiPassword).toBe('encrypted_newpassword');
      expect(mockRouter.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await updateMikrotikRouter(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('deleteMikrotikRouter', () => {
    it('should delete a Mikrotik router and associated users', async () => {
      const mockRouter = {
        _id: 'testRouterId',
        tenant: 'testTenant',
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      MikrotikUser.deleteMany.mockResolvedValue({});

      await deleteMikrotikRouter(req, res);

      expect(MikrotikUser.deleteMany).toHaveBeenCalledWith({ mikrotikRouter: 'testRouterId' });
      expect(mockRouter.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Router and associated users removed successfully.' });
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await deleteMikrotikRouter(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('testMikrotikConnection', () => {
    it('should return connection successful', async () => {
      req.user.roles = ['SUPER_ADMIN'];
      req.body = {
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        apiPort: 8728,
      };
      mockRouterOSAPIInstance.connect.mockResolvedValue(true);
      mockRouterOSAPIInstance.write.mockResolvedValue([]);

      await testMikrotikConnection(req, res);

      expect(RouterOSAPI).toHaveBeenCalledWith(expect.objectContaining({ host: '192.168.1.1' }));
      expect(mockRouterOSAPIInstance.connect).toHaveBeenCalled();
      expect(mockRouterOSAPIInstance.write).toHaveBeenCalledWith('/system/resource/print');
      expect(mockRouterOSAPIInstance.close).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Connection successful' });
    });

    it('should return 403 if not Super Admin', async () => {
      req.user.roles = ['ADMIN']; // Not SUPER_ADMIN
      req.body = {
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        apiPort: 8728,
      };

      await testMikrotikConnection(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledWith(new Error('Not authorized to access this resource. Super Admin access required.'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 400 if required fields are missing', async () => {
      req.user.roles = ['SUPER_ADMIN'];
      req.body = { ipAddress: '192.168.1.1' }; // Missing other fields

      await testMikrotikConnection(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(new Error('Please provide IP address, username, password, and port to test connection'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 500 if connection fails', async () => {
      req.user.roles = ['SUPER_ADMIN'];
      req.body = {
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'password',
        apiPort: 8728,
      };
      mockRouterOSAPIInstance.connect.mockRejectedValue(new Error('Connection refused'));

      await testMikrotikConnection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Connection failed: Connection refused' });
    });
  });

  describe('getMikrotikPppProfiles', () => {
    it('should return PPP profiles', async () => {
      const mockRouter = {
        _id: 'testRouterId',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'encrypted_password',
        apiPort: 8728,
        tenant: 'testTenant',
      };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      mockRouterOSAPIInstance.write.mockResolvedValue([{ name: 'profile1' }, { name: 'profile2' }]);

      await getMikrotikPppProfiles(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'testRouterId', tenant: 'testTenant' });
      expect(decrypt).toHaveBeenCalledWith('encrypted_password');
      expect(mockRouterOSAPIInstance.connect).toHaveBeenCalled();
      expect(mockRouterOSAPIInstance.write).toHaveBeenCalledWith('/ppp/profile/print');
      expect(mockRouterOSAPIInstance.close).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(['profile1', 'profile2']);
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getMikrotikPppProfiles(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });

    it('should return 500 if fetching profiles fails', async () => {
      const mockRouter = {
        _id: 'testRouterId',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'encrypted_password',
        apiPort: 8728,
        tenant: 'testTenant',
      };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      mockRouterOSAPIInstance.connect.mockRejectedValue(new Error('API error'));

      await getMikrotikPppProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch PPP profiles from Mikrotik', error: 'API error' });
    });
  });

  describe('getMikrotikPppServices', () => {
    it('should return common PPP services', async () => {
      const mockRouter = { _id: 'testRouterId', tenant: 'testTenant' };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);

      await getMikrotikPppServices(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'testRouterId', tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(['any', 'async', 'l2tp', 'ovpn', 'pppoe', 'pptp', 'sstp']);
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getMikrotikPppServices(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('getMikrotikRouterStatus', () => {
    it('should return online status if connection successful', async () => {
      const mockRouter = {
        _id: 'testRouterId',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'encrypted_password',
        apiPort: 8728,
        tenant: 'testTenant',
      };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      mockRouterOSAPIInstance.connect.mockResolvedValue(true);
      mockRouterOSAPIInstance.write.mockResolvedValue([]);

      await getMikrotikRouterStatus(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'testRouterId', tenant: 'testTenant' });
      expect(decrypt).toHaveBeenCalledWith('encrypted_password');
      expect(mockRouterOSAPIInstance.connect).toHaveBeenCalled();
      expect(mockRouterOSAPIInstance.write).toHaveBeenCalledWith('/system/resource/print');
      expect(mockRouterOSAPIInstance.close).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'online' });
    });

    it('should return offline status if connection fails', async () => {
      const mockRouter = {
        _id: 'testRouterId',
        ipAddress: '192.168.1.1',
        apiUsername: 'admin',
        apiPassword: 'encrypted_password',
        apiPort: 8728,
        tenant: 'testTenant',
      };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      mockRouterOSAPIInstance.connect.mockRejectedValue(new Error('Connection refused'));

      await getMikrotikRouterStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'offline' });
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getMikrotikRouterStatus(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('getHotspotServers', () => {
    it('should return hotspot servers', async () => {
      const mockRouter = { _id: 'testRouterId', tenant: 'testTenant' };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      mikrotikUtils.getHotspotServers.mockResolvedValue(['server1', 'server2']);

      await getHotspotServers(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'testRouterId', tenant: 'testTenant' });
      expect(mikrotikUtils.getHotspotServers).toHaveBeenCalledWith(mockRouter);
      expect(res.json).toHaveBeenCalledWith(['server1', 'server2']);
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getHotspotServers(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });

  describe('getHotspotProfiles', () => {
    it('should return hotspot profiles', async () => {
      const mockRouter = { _id: 'testRouterId', tenant: 'testTenant' };
      MikrotikRouter.findOne.mockResolvedValue(mockRouter);
      mikrotikUtils.getHotspotProfiles.mockResolvedValue(['profileA', 'profileB']);

      await getHotspotProfiles(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'testRouterId', tenant: 'testTenant' });
      expect(mikrotikUtils.getHotspotProfiles).toHaveBeenCalledWith(mockRouter);
      expect(res.json).toHaveBeenCalledWith(['profileA', 'profileB']);
    });

    it('should return 404 if router not found', async () => {
      MikrotikRouter.findOne.mockResolvedValue(null);

      await getHotspotProfiles(req, res, next); // Pass next

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Router not found'));
      expect(res.json).not.toHaveBeenCalled(); // Ensure res.json is not called
    });
  });
});