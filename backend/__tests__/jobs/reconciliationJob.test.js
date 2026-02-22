
const { setupReconciliationScheduler, processReconciliationScheduler } = require('../../jobs/reconciliationJob');
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

describe('Reconciliation Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupReconciliationScheduler', () => {
    it('should add a repeatable job to the mikrotikSyncQueue', async () => {
      await setupReconciliationScheduler();

      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith(
        'scheduleReconciliation',
        {},
        {
          jobId: 'scheduleReconciliation',
          repeat: {
            cron: '*/15 * * * *',
          },
        }
      );
    });
  });

  describe('processReconciliationScheduler', () => {
    it('should find active tenants and queue a reconciliation job for each', async () => {
      const mockTenants = [
        { _id: 'tenant1', name: 'Tenant One', status: 'active' },
        { _id: 'tenant2', name: 'Tenant Two', status: 'active' },
      ];
      Tenant.find.mockResolvedValue(mockTenants);

      const mockJob = { id: 'job123' };
      await processReconciliationScheduler(mockJob);

      expect(Tenant.find).toHaveBeenCalledWith({ status: 'active' });
      expect(mikrotikSyncQueue.add).toHaveBeenCalledTimes(2);
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('reconcileMikrotikState', {
        tenantId: 'tenant1',
      });
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('reconcileMikrotikState', {
        tenantId: 'tenant2',
      });
    });

    it('should handle the case where there are no active tenants', async () => {
      Tenant.find.mockResolvedValue([]);

      const mockJob = { id: 'job123' };
      await processReconciliationScheduler(mockJob);

      expect(Tenant.find).toHaveBeenCalledWith({ status: 'active' });
      expect(mikrotikSyncQueue.add).not.toHaveBeenCalled();
    });

    it('should throw an error if finding tenants fails', async () => {
      const error = new Error('Database error');
      Tenant.find.mockRejectedValue(error);

      const mockJob = { id: 'job123' };
      await expect(processReconciliationScheduler(mockJob)).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error in reconciliation scheduler:'), error);
    });
  });
});
