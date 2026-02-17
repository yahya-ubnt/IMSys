const util = require('util');
const { exec } = require('child_process');
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const MikrotikRouter = require('../../models/MikrotikRouter');
const { decrypt } = require('../../utils/crypto');
const { performRouterStatusCheck, startRouterMonitoring, stopRouterMonitoring } = require('../../services/routerMonitoringService');

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('node-routeros');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/crypto');

describe('RouterMonitoringService', () => {
  let mockClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockClient = {
      connect: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
    };
    RouterOSAPI.mockImplementation(() => mockClient);
    decrypt.mockReturnValue('decrypted-password');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockTenantId = 'tenant-123';
  const mockRouter = {
    _id: 'router-1',
    name: 'Test Router',
    ipAddress: '192.168.88.1',
    apiUsername: 'admin',
    apiPassword: 'encrypted-password',
    apiPort: 8728,
    isCoreRouter: true,
    location: 'Test Location',
  };

  describe('performRouterStatusCheck', () => {
    it('should do nothing if no core routers are found', async () => {
      MikrotikRouter.find.mockResolvedValue([]);
      await performRouterStatusCheck(mockTenantId);
      expect(MikrotikRouter.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should update router as online if API connects successfully', async () => {
      MikrotikRouter.find.mockResolvedValue([mockRouter]);
      mockClient.connect.mockResolvedValue();

      await performRouterStatusCheck(mockTenantId);

      expect(MikrotikRouter.findByIdAndUpdate).toHaveBeenCalledWith('router-1', {
        isOnline: true,
        location: 'Test Location',
        lastChecked: expect.any(Date),
      });
    });

    it('should update router as API Unreachable if API fails but ping succeeds', async () => {
      MikrotikRouter.find.mockResolvedValue([mockRouter]);
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));
      exec.mockImplementation((command, callback) => {
        callback(null, { stdout: '1 packets transmitted, 1 received' });
      });

      const promise = performRouterStatusCheck(mockTenantId);
      await jest.runAllTimersAsync();
      await promise;

      expect(MikrotikRouter.findByIdAndUpdate).toHaveBeenCalledWith('router-1', {
        isOnline: true,
        location: 'Test Location (API Unreachable)',
        lastChecked: expect.any(Date),
      });
    });

    it('should update router as Offline if API and ping fail', async () => {
      const nonCoreRouter = { ...mockRouter, isCoreRouter: false };
      MikrotikRouter.find.mockResolvedValue([nonCoreRouter]);
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));
      exec.mockImplementation((command, callback) => {
        callback(new Error('Ping failed'));
      });

      const promise = performRouterStatusCheck(mockTenantId);
      await jest.runAllTimersAsync();
      await promise;

      expect(MikrotikRouter.findByIdAndUpdate).toHaveBeenCalledWith('router-1', {
        isOnline: false,
        location: 'Test Location (Offline)',
        lastChecked: expect.any(Date),
      });
    });

    it('should update core router as Via Tunnel if API/ping fail but tunnel IP is pingable', async () => {
      const coreRouterWithTunnel = { ...mockRouter, tunnelIp: '10.0.0.1' };
      MikrotikRouter.find.mockResolvedValue([coreRouterWithTunnel]);
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));
      exec.mockImplementation((command, callback) => {
        if (command.includes('10.0.0.1')) {
          callback(null, { stdout: '1 packets transmitted, 1 received' });
        } else {
          callback(new Error('Ping failed'));
        }
      });

      const promise = performRouterStatusCheck(mockTenantId);
      await jest.runAllTimersAsync();
      await promise;

      expect(MikrotikRouter.findByIdAndUpdate).toHaveBeenCalledWith('router-1', {
        isOnline: true,
        location: 'Test Location (Via Tunnel)',
        lastChecked: expect.any(Date),
      });
    });
  });

  describe('startRouterMonitoring and stopRouterMonitoring', () => {
    it('should start and stop the monitoring interval', () => {
        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'clearInterval');
    
        startRouterMonitoring(10000);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 10000);
    
        stopRouterMonitoring();
        expect(clearInterval).toHaveBeenCalledTimes(1);
      });
  });
});