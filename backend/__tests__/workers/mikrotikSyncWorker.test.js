const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Worker } = require('bullmq');
const MikrotikUser = require('../../models/MikrotikUser');
const MikrotikRouter = require('../../models/MikrotikRouter');
const Tenant = require('../../models/Tenant');
const Package = require('../../models/Package');

// Mock BullMQ to capture the job processor
jest.mock('bullmq');
let jobProcessor;
Worker.mockImplementation((queueName, processor) => {
  jobProcessor = processor;
  return { on: jest.fn() };
});

// Mock Mikrotik Utils to avoid hardware interaction
jest.mock('../../utils/mikrotikUtils', () => ({
  getMikrotikApiClient: jest.fn(),
  syncMikrotikUser: jest.fn().mockResolvedValue(true),
  injectNetwatchScript: jest.fn().mockResolvedValue(true),
  injectPPPProfileScripts: jest.fn().mockResolvedValue(true),
}));

const { syncMikrotikUser, getMikrotikApiClient } = require('../../utils/mikrotikUtils');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');
jest.mock('../../queues/mikrotikSyncQueue', () => ({
    add: jest.fn()
}));

// Mock DB connection in worker
jest.mock('../../config/db', () => jest.fn());

// Require the worker to trigger the capture of jobProcessor
require('../../workers/mikrotikSyncWorker');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Mikrotik Sync Worker (Functional Integration)', () => {
  let tenant, router, pkg, user;

  beforeEach(async () => {
    await MikrotikUser.deleteMany({});
    await MikrotikRouter.deleteMany({});
    await Tenant.deleteMany({});
    await Package.deleteMany({});

    tenant = await Tenant.create({ name: 'Sync Tenant' });
    router = await MikrotikRouter.create({
      name: 'Router 1',
      ipAddress: '1.1.1.1',
      apiUsername: 'a',
      apiPassword: 'p',
      apiPort: 8728,
      tenant: tenant._id
    });
    pkg = await Package.create({
      name: 'Gold',
      price: 1000,
      serviceType: 'pppoe',
      status: 'active',
      profile: 'gold_profile',
      mikrotikRouter: router._id,
      tenant: tenant._id
    });
    user = await MikrotikUser.create({
      officialName: 'John Doe',
      username: 'johndoe',
      mPesaRefNo: '123456',
      serviceType: 'pppoe',
      package: pkg._id,
      mikrotikRouter: router._id,
      tenant: tenant._id,
      billingCycle: 'Monthly',
      mobileNumber: '123',
      expiryDate: new Date(Date.now() + 86400000), // 1 day future
      syncStatus: 'pending'
    });

    jest.clearAllMocks();
  });

  describe('syncUser job', () => {
    it('should fetch user and call syncMikrotikUser util', async () => {
      const mockClient = { write: jest.fn(), close: jest.fn() };
      getMikrotikApiClient.mockResolvedValue(mockClient);

      const job = { 
        name: 'syncUser', 
        data: { mikrotikUserId: user._id, tenantId: tenant._id } 
      };

      await jobProcessor(job);

      // Verify util was called
      expect(syncMikrotikUser).toHaveBeenCalled();
      
      // Verify DB was updated
      const updatedUser = await MikrotikUser.findById(user._id);
      expect(updatedUser.syncStatus).toBe('synced');
      expect(updatedUser.provisionedOnMikrotik).toBe(true);
    });

    it('should set status to error if sync fails', async () => {
        getMikrotikApiClient.mockRejectedValue(new Error('Connection Failed'));

        const job = { 
            name: 'syncUser', 
            data: { mikrotikUserId: user._id, tenantId: tenant._id } 
        };

        try {
            await jobProcessor(job);
        } catch (e) {
            // Expected
        }

        const updatedUser = await MikrotikUser.findById(user._id);
        expect(updatedUser.syncStatus).toBe('error');
        expect(updatedUser.syncErrorMessage).toBe('Connection Failed');
    });
  });

  describe('processExpiredClientsForTenant job', () => {
      it('should find expired users and queue disconnect jobs', async () => {
          // Make user expired
          user.expiryDate = new Date(Date.now() - 86400000);
          user.isSuspended = false;
          await user.save();

          const job = {
              name: 'processExpiredClientsForTenant',
              data: { tenantId: tenant._id }
          };

          await jobProcessor(job);

          // Verify user marked as suspended in DB
          const expiredUser = await MikrotikUser.findById(user._id);
          expect(expiredUser.isSuspended).toBe(true);
          expect(expiredUser.syncStatus).toBe('pending');

          // Verify disconnect job was queued
          expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('disconnectUser', expect.objectContaining({
              mikrotikUserId: user._id,
              reason: 'expired'
          }));
      });
  });

  describe('reconcileMikrotikState job', () => {
      it('should identify out-of-sync users and trigger sync', async () => {
          const mockClient = { 
              write: jest.fn(), 
              close: jest.fn() 
          };
          getMikrotikApiClient.mockResolvedValue(mockClient);

          // Return "no secrets" from router to simulate out-of-sync
          mockClient.write.mockImplementation((path) => {
              if (path === '/ppp/secret/print') return Promise.resolve([]);
              return Promise.resolve([]);
          });

          const job = {
              name: 'reconcileMikrotikState',
              data: { tenantId: tenant._id }
          };

          await jobProcessor(job);

          // Verify it detected discrepancy and added sync job
          expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', expect.objectContaining({
              mikrotikUserId: user._id
          }));
      });
  });
});
