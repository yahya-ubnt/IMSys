
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const MikrotikUser = require('../../models/MikrotikUser');
const MikrotikRouter = require('../../models/MikrotikRouter');
const Device = require('../../models/Device');
const Package = require('../../models/Package');
const { decrypt } = require('../../utils/crypto');
const { getMikrotikApiClient, injectNetwatchScript, injectPPPProfileScripts } = require('../../utils/mikrotikUtils');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');
const { processExpiredClientDisconnectScheduler } = require('../../jobs/scheduleExpiredClientDisconnectsJob');
const { processReconciliationScheduler } = require('../../jobs/reconciliationJob');

// Mock all external dependencies
jest.mock('bullmq');
jest.mock('mongoose');
jest.mock('../../config/db');
jest.mock('../../models/MikrotikUser');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../models/Device');
jest.mock('../../models/Package');
jest.mock('../../utils/crypto');
jest.mock('../../utils/mikrotikUtils');
jest.mock('../../queues/mikrotikSyncQueue');
jest.mock('../../jobs/scheduleExpiredClientDisconnectsJob');
jest.mock('../../jobs/reconciliationJob');

// Mock console.log and console.error to prevent clutter during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});


describe('MikroTik Sync Worker', () => {
  let workerProcessFunction;
  let mockJob;

  beforeAll(() => {
    // Mock the Worker constructor to capture the process function
    Worker.mockImplementation((name, processor, options) => {
      workerProcessFunction = processor;
      return {
        on: jest.fn(), // Mock the 'on' method if the worker uses it
      };
    });

    // Import the worker after mocking Worker to ensure the mock is used
    // This ensures connectDB is called after it's mocked
    require('../../workers/mikrotikSyncWorker');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJob = {
      data: {},
      name: '',
      log: jest.fn(),
      updateProgress: jest.fn(),
    };

    // Default mocks for common dependencies
    connectDB.mockImplementation(() => {});
    decrypt.mockReturnValue('decryptedPassword');
    getMikrotikApiClient.mockResolvedValue({
      connect: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
      write: jest.fn().mockResolvedValue([]),
    });

    // Mock Mongoose chainable methods
    const mockMongooseQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
      cursor: jest.fn().mockReturnThis(),
      eachAsync: jest.fn(async (callback) => { /* do nothing by default */ }),
    };

    MikrotikUser.findById.mockReturnValue(mockMongooseQuery);
    MikrotikUser.find.mockReturnValue(mockMongooseQuery);
    // Removed MikrotikUser.prototype.save as it causes TypeError

    MikrotikRouter.findById.mockResolvedValue(null);
    // Removed MikrotikRouter.prototype.save

    Device.findById.mockReturnValue(mockMongooseQuery);
    Device.find.mockReturnValue(mockMongooseQuery);
    // Removed Device.prototype.save

    Package.findById.mockResolvedValue(null);
    // Removed Package.prototype.save

    mikrotikSyncQueue.add.mockResolvedValue(true);
    processExpiredClientDisconnectScheduler.mockResolvedValue(true);
    processReconciliationScheduler.mockResolvedValue(true);
    injectNetwatchScript.mockResolvedValue(true);
    injectPPPProfileScripts.mockResolvedValue(true);
  });

  it('should call connectDB on worker initialization', () => {
    expect(connectDB).toHaveBeenCalled();
  });

  describe('enableNetwatch job', () => {
    it('should inject netwatch script for the device', async () => {
      mockJob.name = 'enableNetwatch';
      mockJob.data = { deviceId: 'device123', tenantId: 'tenant123' };
      const mockRouter = { _id: 'router123', ipAddress: '192.168.1.1', apiUsername: 'admin', apiPassword: 'encryptedPassword', name: 'TestRouter' };
      const mockDevice = {
        _id: 'device123',
        deviceName: 'TestDevice',
        ipAddress: '192.168.1.100',
        router: mockRouter,
        save: jest.fn().mockResolvedValue(true),
      };
      Device.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDevice),
      });
      // MikrotikRouter.findById.mockResolvedValue(mockRouter); // Not needed if router is populated

      await workerProcessFunction(mockJob);

      expect(Device.findById).toHaveBeenCalledWith('device123');
      expect(injectNetwatchScript).toHaveBeenCalledWith(mockRouter, mockDevice);
    });

    it('should throw error if device not found for enableNetwatch', async () => {
      mockJob.name = 'enableNetwatch';
      mockJob.data = { deviceId: 'nonexistent', tenantId: 'tenant123' };
      Device.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(workerProcessFunction(mockJob)).rejects.toThrow('Device nonexistent not found.');
    });

    it('should throw error if router not found for device in enableNetwatch', async () => {
      mockJob.name = 'enableNetwatch';
      mockJob.data = { deviceId: 'device123', tenantId: 'tenant123' };
      const mockDeviceWithoutRouter = {
        _id: 'device123',
        deviceName: 'TestDevice',
        ipAddress: '192.168.1.100',
        router: null, // Simulate router not found
        save: jest.fn().mockResolvedValue(true),
      };
      Device.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDeviceWithoutRouter),
      });

      await expect(workerProcessFunction(mockJob)).rejects.toThrow('Router not found for device TestDevice');
    });
  });

  describe('User Sync jobs (addUser, updateUser, disconnectUser, connectUser, syncUser)', () => {
    let mockUser, mockRouter, mockPackage;

    beforeEach(() => {
      mockRouter = { _id: 'router123', ipAddress: '192.168.1.1', apiUsername: 'admin', apiPassword: 'encryptedPassword', name: 'TestRouter' };
      mockPackage = { _id: 'package123', profile: 'default', rateLimit: '1M/1M' };
      mockUser = {
        _id: 'user123',
        username: 'testuser',
        serviceType: 'pppoe',
        mikrotikRouter: mockRouter,
        package: mockPackage,
        isSuspended: false,
        provisionedOnMikrotik: false,
        syncStatus: 'pending',
        save: jest.fn().mockResolvedValue(true), // Ensure save is mocked on the instance
      };
      MikrotikUser.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      getMikrotikApiClient.mockResolvedValue({
        connect: jest.fn().mockResolvedValue(true),
        close: jest.fn(),
        write: jest.fn().mockResolvedValue([]),
      });
      injectPPPProfileScripts.mockResolvedValue(true); // Mock this as it's called by syncMikrotikUser
    });

    const jobTypes = ['addUser', 'updateUser', 'disconnectUser', 'connectUser', 'syncUser'];

    jobTypes.forEach(jobType => {
      it(`should sync Mikrotik user for ${jobType} job`, async () => {
        mockJob.name = jobType;
        mockJob.data = { mikrotikUserId: 'user123', tenantId: 'tenant123' };

        await workerProcessFunction(mockJob);

        expect(MikrotikUser.findById).toHaveBeenCalledWith('user123');
        expect(getMikrotikApiClient).toHaveBeenCalledWith(mockRouter);
        expect(mockUser.provisionedOnMikrotik).toBe(true);
        expect(mockUser.syncStatus).toBe('synced');
        expect(mockUser.syncErrorMessage).toBeUndefined();
        expect(mockUser.lastSyncedAt).toBeInstanceOf(Date);
        expect(mockUser.save).toHaveBeenCalled();
      });
    });

    it('should handle user not found for sync job', async () => {
      mockJob.name = 'syncUser';
      mockJob.data = { mikrotikUserId: 'nonexistent', tenantId: 'tenant123' };
      MikrotikUser.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(workerProcessFunction(mockJob)).rejects.toThrow('MikroTik User with ID nonexistent not found.');
    });

    it('should handle router not found for sync job', async () => {
      mockJob.name = 'syncUser';
      mockJob.data = { mikrotikUserId: 'user123', tenantId: 'tenant123' };
      mockUser.mikrotikRouter = null; // Simulate router not found
      MikrotikUser.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(workerProcessFunction(mockJob)).rejects.toThrow('Associated MikroTik Router not found for user testuser.');
    });

    it('should handle Mikrotik API client connection failure for sync job', async () => {
      mockJob.name = 'syncUser';
      mockJob.data = { mikrotikUserId: 'user123', tenantId: 'tenant123' };
      getMikrotikApiClient.mockResolvedValue(null); // Simulate connection failure

      await expect(workerProcessFunction(mockJob)).rejects.toThrow('Failed to connect to MikroTik router 192.168.1.1.');
      expect(mockUser.syncStatus).toBe('error');
      expect(mockUser.syncErrorMessage).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('scheduleExpiredClientDisconnects job', () => {
    it('should call processExpiredClientDisconnectScheduler', async () => {
      mockJob.name = 'scheduleExpiredClientDisconnects';
      mockJob.data = { tenantId: 'tenant123' };

      await workerProcessFunction(mockJob);

      expect(processExpiredClientDisconnectScheduler).toHaveBeenCalledWith(mockJob);
    });
  });

  describe('processExpiredClientsForTenant job', () => {
    let mockExpiredUser;
    beforeEach(() => {
      mockExpiredUser = {
        _id: 'expiredUser123',
        username: 'expireduser',
        expiryDate: new Date(Date.now() - 86400000), // Yesterday
        isSuspended: false,
        save: jest.fn().mockResolvedValue(true),
      };
      MikrotikUser.find.mockReturnValue({
        cursor: jest.fn().mockReturnThis(),
        eachAsync: jest.fn(async (callback) => {
          await callback(mockExpiredUser);
        }),
      });
    });

    it('should process expired clients and queue disconnect jobs', async () => {
      mockJob.name = 'processExpiredClientsForTenant';
      mockJob.data = { tenantId: 'tenant123' };

      await workerProcessFunction(mockJob);

      expect(MikrotikUser.find).toHaveBeenCalledWith({
        tenant: 'tenant123',
        expiryDate: { $lte: expect.any(Date) },
        isSuspended: false,
      });
      expect(mockExpiredUser.isSuspended).toBe(true);
      expect(mockExpiredUser.syncStatus).toBe('pending');
      expect(mockExpiredUser.save).toHaveBeenCalled();
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('disconnectUser', {
        mikrotikUserId: 'expiredUser123',
        tenantId: 'tenant123',
        reason: 'expired',
      });
    });
  });

  describe('scheduleReconciliation job', () => {
    it('should call processReconciliationScheduler', async () => {
      mockJob.name = 'scheduleReconciliation';
      mockJob.data = { tenantId: 'tenant123' };

      await workerProcessFunction(mockJob);

      expect(processReconciliationScheduler).toHaveBeenCalledWith(mockJob);
    });
  });

  describe('reconcileMikrotikState job', () => {
    let mockRouterClient;
    let mockDbUserPppoe, mockDbUserStatic;
    let mockRouter; // Define mockRouter here

    beforeEach(() => {
      mockRouter = { _id: 'router123', ipAddress: '192.168.1.1', apiUsername: 'admin', apiPassword: 'encryptedPassword', name: 'TestRouter' }; // Initialize mockRouter
      mockRouterClient = {
        connect: jest.fn().mockResolvedValue(true),
        close: jest.fn(),
        write: jest.fn((command) => {
          if (command === '/ppp/secret/print') return [{ name: 'testuser', profile: 'default', disabled: 'no', password: 'pppoePassword' }];
          if (command === '/queue/simple/print') return [{ name: 'staticuser', 'max-limit': '1M/1M' }];
          if (command === '/ip/dhcp-server/lease/print') return [];
          if (command === '/ip/firewall/address-list/print') return [];
          if (command === '/tool/netwatch/print') return [];
          return [];
        }),
      };
      getMikrotikApiClient.mockResolvedValue(mockRouterClient);

      mockDbUserPppoe = {
        _id: 'userPppoe123',
        username: 'testuser',
        serviceType: 'pppoe',
        mikrotikRouter: mockRouter,
        package: { _id: 'packagePppoe123', profile: 'default' },
        isSuspended: false,
        pppoePassword: 'pppoePassword',
        syncStatus: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockDbUserStatic = {
        _id: 'userStatic123',
        username: 'staticuser',
        serviceType: 'static',
        mikrotikRouter: mockRouter,
        package: { _id: 'packageStatic123', rateLimit: '1M/1M' },
        isSuspended: false,
        ipAddress: '192.168.1.200',
        syncStatus: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      MikrotikUser.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockDbUserPppoe, mockDbUserStatic]),
      });
      Device.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]), // No devices for netwatch healing by default
      });
    });

    it('should reconcile Mikrotik state and update user sync status', async () => {
      mockJob.name = 'reconcileMikrotikState';
      mockJob.data = { tenantId: 'tenant123' };

      await workerProcessFunction(mockJob);

      expect(MikrotikUser.find).toHaveBeenCalledWith({ tenant: 'tenant123' });
      expect(getMikrotikApiClient).toHaveBeenCalledWith(mockRouter);
      expect(mockRouterClient.write).toHaveBeenCalledWith('/ppp/secret/print');
      expect(mockRouterClient.write).toHaveBeenCalledWith('/queue/simple/print');
      expect(mockDbUserPppoe.syncStatus).toBe('synced');
      expect(mockDbUserPppoe.save).toHaveBeenCalled();
      expect(mockDbUserStatic.syncStatus).toBe('synced');
      expect(mockDbUserStatic.save).toHaveBeenCalled();
      expect(injectPPPProfileScripts).toHaveBeenCalledWith(mockRouter);
      expect(mockRouterClient.close).toHaveBeenCalled();
    });

    it('should queue syncUser job if PPPoE user is out of sync', async () => {
      mockJob.name = 'reconcileMikrotikState';
      mockJob.data = { tenantId: 'tenant123' };
      mockRouterClient.write.mockImplementation((command) => {
        if (command === '/ppp/secret/print') return [{ name: 'testuser', profile: 'wrongProfile', disabled: 'no', password: 'pppoePassword' }];
        return [];
      });

      await workerProcessFunction(mockJob);

      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', { mikrotikUserId: mockDbUserPppoe._id, tenantId: 'tenant123' });
    });

    it('should queue syncUser job if Static user is out of sync', async () => {
      mockJob.name = 'reconcileMikrotikState';
      mockJob.data = { tenantId: 'tenant123' };
      mockRouterClient.write.mockImplementation((command) => {
        if (command === '/queue/simple/print') return [{ name: 'staticuser', 'max-limit': '2M/2M' }]; // Wrong rate limit
        return [];
      });

      await workerProcessFunction(mockJob);

      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', { mikrotikUserId: mockDbUserStatic._id, tenantId: 'tenant123' });
    });

    it('should heal netwatch rules for devices', async () => {
      mockJob.name = 'reconcileMikrotikState';
      mockJob.data = { tenantId: 'tenant123' };
      const mockDevice = {
        _id: 'device123',
        deviceName: 'TestDevice',
        ipAddress: '192.168.1.100',
        router: mockRouter, // Reference the mockRouter defined in beforeEach
        save: jest.fn().mockResolvedValue(true),
      };
      Device.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockDevice]),
      });
      mockRouterClient.write.mockImplementation((command) => {
        if (command === '/tool/netwatch/print') return []; // Simulate missing netwatch rule
        return [];
      });

      await workerProcessFunction(mockJob);

      expect(injectNetwatchScript).toHaveBeenCalledWith(mockRouter, mockDevice);
    });

    it('should handle router connection failure during reconciliation', async () => {
      mockJob.name = 'reconcileMikrotikState';
      mockJob.data = { tenantId: 'tenant123' };
      getMikrotikApiClient.mockResolvedValue(null); // Simulate connection failure

      await workerProcessFunction(mockJob);

      expect(mockDbUserPppoe.syncStatus).toBe('error');
      expect(mockDbUserPppoe.syncErrorMessage).toBeDefined();
      expect(mockDbUserPppoe.save).toHaveBeenCalled();
      expect(mockDbUserStatic.syncStatus).toBe('error');
      expect(mockDbUserStatic.syncErrorMessage).toBeDefined();
      expect(mockDbUserStatic.save).toHaveBeenCalled();
    });
  });

  it('should log a warning for unknown job types', async () => {
    mockJob.name = 'unknownJob';
    mockJob.data = { tenantId: 'tenant123' };
    // console.warn is already spied on globally
    await workerProcessFunction(mockJob);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown job type: unknownJob'));
  });

  it('should handle errors during job processing and update user status', async () => {
    mockJob.name = 'syncUser';
    mockJob.data = { mikrotikUserId: 'user123', tenantId: 'tenant123' };
    const mockRouter = { _id: 'router123', ipAddress: '192.168.1.1', apiUsername: 'admin', apiPassword: 'encryptedPassword', name: 'TestRouter' };
    const mockPackage = { _id: 'package123', profile: 'default', rateLimit: '1M/1M' };
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      serviceType: 'pppoe',
      mikrotikRouter: mockRouter,
      package: mockPackage,
      save: jest.fn().mockResolvedValue(true),
    };
    MikrotikUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    getMikrotikApiClient.mockRejectedValue(new Error('API connection error')); // Simulate API error

    await expect(workerProcessFunction(mockJob)).rejects.toThrow('API connection error');
    expect(mockUser.syncStatus).toBe('error');
    expect(mockUser.syncErrorMessage).toBe('API connection error');
    expect(mockUser.save).toHaveBeenCalled();
  });
});
