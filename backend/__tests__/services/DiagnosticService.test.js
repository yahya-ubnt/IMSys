jest.mock('../../models/MikrotikUser');
jest.mock('../../models/DiagnosticLog');
jest.mock('../../models/Device');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/mikrotikUtils', () => ({
  checkRouterStatus: jest.fn(),
  checkUserStatus: jest.fn(),
  checkCPEStatus: jest.fn(),
}));

const DiagnosticService = require('../../services/DiagnosticService');
const MikrotikUser = require('../../models/MikrotikUser');
const DiagnosticLog = require('../../models/DiagnosticLog');
const Device = require('../../models/Device');
const MikrotikRouter = require('../../models/MikrotikRouter');
const { checkRouterStatus, checkUserStatus, checkCPEStatus } = require('../../utils/mikrotikUtils');

// Helper to create a chainable Mongoose mock query object
const createMockQuery = (resolvedValue) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue), // For explicit .exec()
    then: jest.fn(function(resolve, reject) { // For implicit await
        return Promise.resolve(resolvedValue).then(resolve, reject);
    }),
});

describe('DiagnosticService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runDiagnostic', () => {
    it('should run a diagnostic and log steps', async () => {
      const mockUser = {
        _id: 'user-1',
        tenant: 'tenant-1',
        expiryDate: new Date('2025-01-01'),
        mikrotikRouter: { _id: 'router-1', name: 'Router1', ipAddress: '1.1.1.1' },
        username: 'testuser',
        station: null,
        building: null,
        apartment_house_number: null,
      };
      MikrotikUser.findOne.mockReturnValue(createMockQuery(mockUser));
      checkRouterStatus.mockResolvedValue(true);
      checkUserStatus.mockResolvedValue(true);
      DiagnosticLog.create.mockResolvedValue({ _id: 'log-1' });

      const sendEvent = jest.fn();
      const result = await DiagnosticService.runDiagnostic('user-1', 'tenant-1', sendEvent);

      expect(MikrotikUser.findOne).toHaveBeenCalled();
      expect(checkRouterStatus).toHaveBeenCalled();
      expect(checkUserStatus).toHaveBeenCalled();
      expect(DiagnosticLog.create).toHaveBeenCalled();
      expect(sendEvent).toHaveBeenCalledWith('start', expect.any(Object));
      expect(sendEvent).toHaveBeenCalledWith('step', expect.any(Object));
      expect(sendEvent).toHaveBeenCalledWith('done', expect.any(Object));
      expect(result._id).toBe('log-1');
    });

    it('should throw an error if Mikrotik User not found', async () => {
      MikrotikUser.findOne.mockReturnValue(createMockQuery(null)); // User not found
      DiagnosticLog.create.mockResolvedValue({ _id: 'log-1' }); // Should not be called

      await expect(DiagnosticService.runDiagnostic('user-nonexistent', 'tenant-1')).rejects.toThrow('Mikrotik User not found');
      expect(DiagnosticLog.create).not.toHaveBeenCalled();
    });
  });

  describe('getDiagnosticHistory', () => {
    it('should return diagnostic logs for a user', async () => {
      const mockLogs = [{ _id: 'log-1' }, { _id: 'log-2' }];
      DiagnosticLog.find.mockReturnValue(createMockQuery(mockLogs));

      const result = await DiagnosticService.getDiagnosticHistory('user-1', 'tenant-1');
      expect(DiagnosticLog.find).toHaveBeenCalledWith({ tenant: 'tenant-1', mikrotikUser: 'user-1' });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getDiagnosticLogById', () => {
    it('should return a diagnostic log by ID', async () => {
      const mockLog = { _id: 'log-1' };
      DiagnosticLog.findOne.mockReturnValue(createMockQuery(mockLog));

      const result = await DiagnosticService.getDiagnosticLogById('log-1', 'user-1', 'tenant-1');
      expect(DiagnosticLog.findOne).toHaveBeenCalledWith({ _id: 'log-1', tenant: 'tenant-1', mikrotikUser: 'user-1' });
      expect(result).toEqual(mockLog);
    });

    it('should throw an error if diagnostic log not found', async () => {
      DiagnosticLog.findOne.mockReturnValue(createMockQuery(null));
      await expect(DiagnosticService.getDiagnosticLogById('log-nonexistent', 'user-1', 'tenant-1')).rejects.toThrow('Diagnostic log not found');
    });
  });

  describe('verifyRootCause', () => {
    it('should return the device itself if no parent', async () => {
      const mockDevice = { _id: 'device-1', parentId: null, save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }) };
      Device.findOne.mockReturnValue(createMockQuery(mockDevice));

      const result = await DiagnosticService.verifyRootCause('device-1', 'tenant-1');
      expect(result).toEqual({ rootCause: mockDevice, path: [mockDevice] });
    });

    it('should find the root cause by walking up the tree', async () => {
        const initialMockParentDevice = { _id: 'parent-1', parentId: null, status: 'UP', deviceName: 'Parent Device', ipAddress: '10.0.0.1' };
        const mockParentDevice = { ...initialMockParentDevice, save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }) };
        
        const initialMockChildDevice = { _id: 'child-1', parentId: mockParentDevice, status: 'UP' };
        const mockChildDevice = { ...initialMockChildDevice, save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }) };
        
        const mockRouter = { _id: 'router-1' };
  
        // Mock Device.findOne for the initial call (child device with populated parent)
        Device.findOne.mockReturnValueOnce(createMockQuery(mockChildDevice));
        // Mock Device.findOne for the recursive call (parent device)
        Device.findOne.mockReturnValueOnce(createMockQuery(mockParentDevice));
        
        // Mock MikrotikRouter.findOne for the core router check
        MikrotikRouter.findOne.mockReturnValue(createMockQuery(mockRouter));
        checkCPEStatus.mockResolvedValue(false); // Parent is offline
        
        const result = await DiagnosticService.verifyRootCause('child-1', 'tenant-1');
        
        // Create a copy of mockParentDevice to compare against its state *after* the service modifies it
        const expectedRootCause = { ...initialMockParentDevice, status: 'DOWN', save: expect.any(Function) };
        expect(result.rootCause).toEqual(expectedRootCause);
        expect(result.path).toEqual([mockChildDevice, mockParentDevice]);
        expect(mockParentDevice.status).toBe('DOWN'); // Parent should be marked down
        expect(mockParentDevice.save).toHaveBeenCalled();
      });
  });
});