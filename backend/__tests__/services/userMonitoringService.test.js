const RouterOSAPI = require('node-routeros').RouterOSAPI;
const MikrotikUser = require('../../models/MikrotikUser');
const UserDowntimeLog = require('../../models/UserDowntimeLog');
const { decrypt } = require('../../utils/crypto');
const { sendConsolidatedAlert } = require('../../services/alertingService');
const { performUserStatusCheck } = require('../../services/userMonitoringService');

jest.mock('node-routeros');
jest.mock('../../models/MikrotikUser');
jest.mock('../../models/UserDowntimeLog');
jest.mock('../../utils/crypto');
jest.mock('../../services/alertingService');

describe('userMonitoringService', () => {
  let mockClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockClient = {
      connect: jest.fn().mockResolvedValue(),
      write: jest.fn(),
      close: jest.fn(),
      connected: true,
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
  };

  it('should do nothing if no users are found', async () => {
    MikrotikUser.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    await performUserStatusCheck(mockTenantId);
    expect(RouterOSAPI).not.toHaveBeenCalled();
  });

  it('should handle a user who is online and stays online', async () => {
    const mockUser = { _id: 'user-1', username: 'testuser', serviceType: 'pppoe', isOnline: true, mikrotikRouter: mockRouter };
    MikrotikUser.find.mockReturnValue({ populate: () => ({ lean: () => Promise.resolve([mockUser]) }) });
    mockClient.write.mockResolvedValue([{ name: 'testuser' }]); // PPP active session

    await performUserStatusCheck(mockTenantId);

    expect(MikrotikUser.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(UserDowntimeLog.findOne).not.toHaveBeenCalled();
  });

  it('should handle a user who was offline and comes online', async () => {
    const mockUser = { _id: 'user-1', username: 'testuser', serviceType: 'pppoe', isOnline: false, mikrotikRouter: mockRouter };
    MikrotikUser.find.mockReturnValue({ populate: () => ({ lean: () => Promise.resolve([mockUser]) }) });
    mockClient.write.mockResolvedValue([{ name: 'testuser' }]);
    UserDowntimeLog.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue({ save: jest.fn() }) });

    await performUserStatusCheck(mockTenantId);

    expect(MikrotikUser.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { isOnline: true, lastChecked: expect.any(Date) });
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockUser], 'ONLINE', mockTenantId, null, 'User');
  });

  it('should handle a user who is online and goes offline', async () => {
    const mockUser = { _id: 'user-1', username: 'testuser', serviceType: 'pppoe', isOnline: true, mikrotikRouter: mockRouter };
    MikrotikUser.find.mockReturnValue({ populate: () => ({ lean: () => Promise.resolve([mockUser]) }) });
    mockClient.write.mockResolvedValue([]); // No PPP active session

    const promise = performUserStatusCheck(mockTenantId);
    await jest.runAllTimersAsync();
    await promise;

    expect(MikrotikUser.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { isOnline: false, lastChecked: expect.any(Date) });
    expect(UserDowntimeLog).toHaveBeenCalled();
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockUser], 'OFFLINE', mockTenantId, null, 'User');
  });

  it('should handle router connection failure', async () => {
    const mockUser = { _id: 'user-1', username: 'testuser', serviceType: 'pppoe', isOnline: true, mikrotikRouter: mockRouter };
    MikrotikUser.find.mockReturnValue({ populate: () => ({ lean: () => Promise.resolve([mockUser]) }) });
    mockClient.connect.mockRejectedValue(new Error('Connection failed'));

    await performUserStatusCheck(mockTenantId);

    expect(MikrotikUser.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { isOnline: false, lastChecked: expect.any(Date) });
    expect(UserDowntimeLog).toHaveBeenCalled();
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockUser], 'OFFLINE (Router Unreachable)', mockTenantId, null, 'User');
  });
});
