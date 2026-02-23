const ScheduledTask = require('../../models/ScheduledTask');
const { createDefaultTasksForTenant } = require('../../services/scheduledTaskService');

jest.mock('../../models/ScheduledTask');

describe('scheduledTaskService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDefaultTasksForTenant', () => {
    it('should create the default set of scheduled tasks for a new tenant', async () => {
      const tenantId = 'tenant-123';
      ScheduledTask.create.mockResolvedValue({});

      await createDefaultTasksForTenant(tenantId);

      // There are 4 default tasks
      expect(ScheduledTask.create).toHaveBeenCalledTimes(4);

      // Check if it was called with the correct data for one of the tasks
      expect(ScheduledTask.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Automated Disconnection of Expired Users',
        tenant: tenantId,
        isEnabled: true,
      }));
    });

    it('should log an error if task creation fails', async () => {
        const tenantId = 'tenant-123';
        const errorMessage = 'Database error';
        ScheduledTask.create.mockRejectedValue(new Error(errorMessage));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
        await createDefaultTasksForTenant(tenantId);
  
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Error creating default scheduled tasks for tenant ${tenantId}:`,
          expect.any(Error)
        );
  
        consoleErrorSpy.mockRestore();
      });
  });
});
