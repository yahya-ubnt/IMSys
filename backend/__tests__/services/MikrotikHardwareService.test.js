jest.mock('../../models/MikrotikUser');
jest.mock('../../utils/crypto', () => ({
  decrypt: jest.fn(password => password),
}));

// Mock node-routeros and expose the mock functions for test-specific configuration
const mockWrite = jest.fn();
const mockConnect = jest.fn().mockResolvedValue(true);
const mockClose = jest.fn().mockResolvedValue(true);

jest.mock('node-routeros', () => {
  const RouterOSAPI = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    write: mockWrite,
    close: mockClose,
  }));
  // Attach mocks to the constructor for easy access in tests
  RouterOSAPI.mockConnect = mockConnect;
  RouterOSAPI.mockWrite = mockWrite;
  RouterOSAPI.mockClose = mockClose;
  return { RouterOSAPI };
});

const MikrotikHardwareService = require('../../services/MikrotikHardwareService');
const MikrotikUser = require('../../models/MikrotikUser');
const { RouterOSAPI } = require('node-routeros');

describe('MikrotikHardwareService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    RouterOSAPI.mockConnect.mockClear();
    RouterOSAPI.mockWrite.mockClear();
    RouterOSAPI.mockClose.mockClear();
  });

  describe('getUserTraffic', () => {
    it('should fetch traffic for a PPPoE user', async () => {
      const mockRouter = { ipAddress: '1.1.1.1' };
      const mockUser = {
        _id: 'user-1',
        serviceType: 'pppoe',
        username: 'testuser',
        mikrotikRouter: mockRouter,
      };

      MikrotikUser.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      // Configure mock responses for this specific test
      RouterOSAPI.mockWrite
        .mockImplementationOnce(() => Promise.resolve([{ name: 'testuser', interface: '<pppoe-testuser>' }])) // First call for /ppp/active
        .mockImplementationOnce(() => Promise.resolve([{ 'rx-bits-per-second': '8000', 'tx-bits-per-second': '4000' }])); // Second call for /interface/monitor-traffic

      const traffic = await MikrotikHardwareService.getUserTraffic('user-1');

      expect(RouterOSAPI).toHaveBeenCalledWith(expect.objectContaining({ host: '1.1.1.1' }));
      expect(RouterOSAPI.mockConnect).toHaveBeenCalled();
      expect(RouterOSAPI.mockWrite).toHaveBeenCalledWith('/ppp/active/print', expect.any(Array));
      expect(RouterOSAPI.mockWrite).toHaveBeenCalledWith('/interface/monitor-traffic', expect.any(Array));
      expect(RouterOSAPI.mockClose).toHaveBeenCalled();
      expect(traffic.rxRate).toBe(1000);
      expect(traffic.txRate).toBe(500);
    });

    it('should return zero traffic if a PPPoE user is not found active', async () => {
      const mockRouter = { ipAddress: '1.1.1.1' };
      const mockUser = {
        _id: 'user-2',
        serviceType: 'pppoe',
        username: 'inactiveuser',
        mikrotikRouter: mockRouter,
      };

      MikrotikUser.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      // For this test, /ppp/active returns an empty array
      RouterOSAPI.mockWrite.mockImplementationOnce(() => Promise.resolve([]));

      const traffic = await MikrotikHardwareService.getUserTraffic('user-2');

      expect(traffic.rxRate).toBe(0);
      expect(traffic.txRate).toBe(0);
      // Ensure we didn't proceed to monitor traffic
      expect(RouterOSAPI.mockWrite).toHaveBeenCalledTimes(1);
    });

    it('should fetch traffic for a static user', async () => {
        const mockRouter = { ipAddress: '1.1.1.1' };
        const mockUser = {
          _id: 'user-3',
          serviceType: 'static',
          username: 'staticuser',
          mikrotikRouter: mockRouter,
        };
  
        MikrotikUser.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser),
        });
  
        // Mock response for /queue/simple/print
        RouterOSAPI.mockWrite.mockImplementationOnce(() => Promise.resolve([
            { rate: '128000/64000', bytes: '1000/500' }
        ]));
  
        const traffic = await MikrotikHardwareService.getUserTraffic('user-3');
  
        expect(RouterOSAPI.mockWrite).toHaveBeenCalledWith('/queue/simple/print', expect.any(Array));
        expect(traffic.rxRate).toBe(128000);
        expect(traffic.txRate).toBe(64000);
        expect(traffic.rxBytes).toBe(1000);
        expect(traffic.txBytes).toBe(500);
      });
  });
});