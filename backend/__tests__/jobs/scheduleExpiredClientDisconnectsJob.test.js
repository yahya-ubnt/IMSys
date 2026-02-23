
const { setupExpiredClientDisconnectScheduler, processExpiredClientDisconnectScheduler } = require('../../jobs/scheduleExpiredClientDisconnectsJob');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');
const Tenant = require('../../models/Tenant');
const connectDB = require('../../config/db');

// Mock dependencies
jest.mock('../../queues/mikrotikSyncQueue', () => ({
    add: jest.fn(),
}));
jest.mock('../../models/Tenant');
jest.mock('../../config/db');

// Mock console.log and console.error to prevent clutter during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Expired Client Disconnects Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupExpiredClientDisconnectScheduler', () => {
    it('should add a repeatable job to the mikrotikSyncQueue', async () => {
      await setupExpiredClientDisconnectScheduler();

      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith(
        'scheduleExpiredClientDisconnects',
        {},
        {
          jobId: 'scheduleExpiredClientDisconnects',
          repeat: {
            cron: '0 0 * * *',
          },
        }
      );
    });
  });

  describe('processExpiredClientDisconnectScheduler', () => {
    it('should find active tenants and queue a job for each', async () => {
      const mockTenants = [
        { _id: 'tenant1', name: 'Tenant One', status: 'active' },
        { _id: 'tenant2', name: 'Tenant Two', status: 'active' },
      ];
      Tenant.find.mockResolvedValue(mockTenants);

      const mockJob = { id: 'job123' };
      await processExpiredClientDisconnectScheduler(mockJob);

      expect(Tenant.find).toHaveBeenCalledWith({ status: 'active' });
      expect(mikrotikSyncQueue.add).toHaveBeenCalledTimes(2);
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('processExpiredClientsForTenant', {
        tenantId: 'tenant1',
      });
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('processExpiredClientsForTenant', {
        tenantId: 'tenant2',
      });
    });

    it('should handle the case where there are no active tenants', async () => {
      Tenant.find.mockResolvedValue([]);

      const mockJob = { id: 'job123' };
      await processExpiredClientDisconnectScheduler(mockJob);

      expect(Tenant.find).toHaveBeenCalledWith({ status: 'active' });
      expect(mikrotikSyncQueue.add).not.toHaveBeenCalled();
    });

    it('should throw an error if finding tenants fails', async () => {
      const error = new Error('Database error');
      Tenant.find.mockRejectedValue(error);

      const mockJob = { id: 'job123' };
      await expect(processExpiredClientDisconnectScheduler(mockJob)).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error in expired client disconnect scheduler:'), error);
    });
  });
});
