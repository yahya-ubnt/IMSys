const { RouterOSAPI } = require('node-routeros');
const { decrypt } = require('../../utils/crypto');
const mikrotikUtils = require('../../utils/mikrotikUtils');

jest.mock('node-routeros');
jest.mock('../../utils/crypto');

describe('mikrotikUtils', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      connect: jest.fn(),
      write: jest.fn(),
      close: jest.fn(),
      connected: true,
    };
    RouterOSAPI.mockImplementation(() => mockClient);
    decrypt.mockReturnValue('decrypted-password');
  });

  describe('getMikrotikApiClient', () => {
    it('should connect and return a client on success', async () => {
      mockClient.connect.mockResolvedValue();
      const router = { ipAddress: '1.1.1.1', apiUsername: 'admin', apiPassword: 'enc', apiPort: 8728 };
      const client = await mikrotikUtils.getMikrotikApiClient(router);
      expect(client).toBe(mockClient);
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should return null on connection failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));
      const router = { ipAddress: '1.1.1.1', name: 'Test Router' };
      const client = await mikrotikUtils.getMikrotikApiClient(router);
      expect(client).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('addHotspotUser', () => {
    it('should add a hotspot user', async () => {
      mockClient.connect.mockResolvedValue();
      const router = { ipAddress: '1.1.1.1' };
      const userData = { username: 'test', password: 'pw', server: 'all', profile: 'default', timeLimit: '1h', dataLimit: '1G' };
      await mikrotikUtils.addHotspotUser(router, userData);
      expect(mockClient.write).toHaveBeenCalledWith('/ip/hotspot/user/add', expect.any(Array));
    });
  });

  describe('removeHotspotUser', () => {
    it('should remove a hotspot user', async () => {
      mockClient.connect.mockResolvedValue();
      mockClient.write.mockResolvedValue([{ '.id': '*1' }]);
      const router = { ipAddress: '1.1.1.1' };
      await mikrotikUtils.removeHotspotUser(router, 'testuser');
      expect(mockClient.write).toHaveBeenCalledWith('/ip/hotspot/user/print', ['?name=testuser']);
      expect(mockClient.write).toHaveBeenCalledWith('/ip/hotspot/user/remove', ['=.id=*1']);
    });
  });

  describe('checkRouterStatus', () => {
    it('should return true when router is online', async () => {
      mockClient.connect.mockResolvedValue();
      const router = { ipAddress: '1.1.1.1' };
      const status = await mikrotikUtils.checkRouterStatus(router);
      expect(status).toBe(true);
    });

    it('should return false when router is offline', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));
      const router = { ipAddress: '1.1.1.1' };
      const status = await mikrotikUtils.checkRouterStatus(router);
      expect(status).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('syncMikrotikUser', () => {
    it('should call ensurePppSecret for pppoe users', async () => {
        const user = { serviceType: 'pppoe', username: 'test', isSuspended: false, package: { profile: 'default' } };
        mockClient.write.mockResolvedValue([]); // No existing secret
        await mikrotikUtils.syncMikrotikUser(mockClient, user);
        expect(mockClient.write).toHaveBeenCalledWith('/ppp/secret/print', ['?name=test']);
        expect(mockClient.write).toHaveBeenCalledWith('/ppp/secret/add', expect.any(Array));
    });

    it('should call ensureStaticLeaseAndQueue for static users', async () => {
        const user = { serviceType: 'static', username: 'static-user', ipAddress: '10.0.0.10', macAddress: 'AA:BB:CC:DD:EE:FF', isSuspended: false, package: { rateLimit: '10M/10M' } };
        mockClient.write.mockResolvedValue([]); // No existing leases or queues
        await mikrotikUtils.syncMikrotikUser(mockClient, user);
        expect(mockClient.write).toHaveBeenCalledWith('/ip/dhcp-server/lease/print', ['?mac-address=AA:BB:CC:DD:EE:FF']);
        expect(mockClient.write).toHaveBeenCalledWith('/queue/simple/print', ['?name=static-user']);
    });
  });
});
