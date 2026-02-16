// Mock dependencies
jest.mock('../../models/MikrotikUser');
jest.mock('../../models/WalletTransaction');
jest.mock('../../queues/mikrotikSyncQueue', () => ({
  add: jest.fn(),
}));
jest.mock('../../services/smsService', () => ({
  sendAcknowledgementSms: jest.fn().mockResolvedValue({}), // Return a promise
}));

const UserService = require('../../services/userService');
const MikrotikUser = require('../../models/MikrotikUser');
const WalletTransaction = require('../../models/WalletTransaction');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');
const { sendAcknowledgementSms } = require('../../services/smsService');

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMikrotikUser', () => {
    it('should create a user, apply installation fee, and send welcome SMS', async () => {
      const userData = {
        officialName: 'Test User',
        mobileNumber: '12345',
        username: 'testuser',
        mPesaRefNo: 'generate_6_digit_number',
        installationFee: 100,
        sendWelcomeSms: true,
      };
      const tenantId = 'tenant-123';

      // Mock for user creation to return the data it was called with
      MikrotikUser.create.mockImplementation(data => Promise.resolve({
        ...data,
        _id: 'user-id-123',
        tenant: tenantId,
        walletBalance: 0,
        save: jest.fn().mockReturnThis(),
      }));
      WalletTransaction.create.mockResolvedValue({});

      const result = await UserService.createMikrotikUser(userData, tenantId);

      expect(MikrotikUser.findOne).toHaveBeenCalled();
      expect(result.mPesaRefNo).toMatch(/^\d{6}$/);
      expect(MikrotikUser.create).toHaveBeenCalledWith(expect.objectContaining({ syncStatus: 'pending' }));
      expect(result.walletBalance).toBe(-100);
      expect(WalletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 100 }));
      expect(result.save).toHaveBeenCalled();
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', expect.any(Object));
      expect(sendAcknowledgementSms).toHaveBeenCalled();
    });

    it('should create a user without installation fee or SMS', async () => {
        const userData = {
          mPesaRefNo: 'provided_ref',
          installationFee: 0,
          sendWelcomeSms: false,
        };
        const tenantId = 'tenant-456';
  
        const mockUser = { ...userData, _id: 'user-id-456' };
        MikrotikUser.create.mockResolvedValue(mockUser);
  
        await UserService.createMikrotikUser(userData, tenantId);
  
        expect(WalletTransaction.create).not.toHaveBeenCalled();
        expect(sendAcknowledgementSms).not.toHaveBeenCalled();
        expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', expect.any(Object));
      });
  });

  describe('updateUser', () => {
    it('should update user and trigger sync for hardware-impacting changes', async () => {
      const user = {
        _id: 'user-1',
        tenant: 'tenant-1',
        package: 'package-A',
        macAddress: 'old-mac',
        save: jest.fn().mockResolvedValue({ _id: 'user-1' }),
      };
      MikrotikUser.findOne.mockResolvedValue(user);

      const updateData = { macAddress: 'new-mac' };
      await UserService.updateUser('user-1', updateData, 'tenant-1');

      expect(user.macAddress).toBe('new-mac');
      expect(user.syncStatus).toBe('pending');
      expect(user.save).toHaveBeenCalled();
      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', {
        mikrotikUserId: 'user-1',
        tenantId: 'tenant-1',
      });
    });

    it('should update user without triggering sync for non-hardware changes', async () => {
        const user = {
          _id: 'user-2',
          tenant: 'tenant-2',
          officialName: 'Old Name',
          save: jest.fn().mockResolvedValue({ _id: 'user-2' }),
        };
        MikrotikUser.findOne.mockResolvedValue(user);
  
        const updateData = { officialName: 'New Name' };
        await UserService.updateUser('user-2', updateData, 'tenant-2');
  
        expect(user.officialName).toBe('New Name');
        expect(user.syncStatus).toBeUndefined(); // or its initial state, but not 'pending'
        expect(user.save).toHaveBeenCalled();
        expect(mikrotikSyncQueue.add).not.toHaveBeenCalled();
      });
  });

  describe('deleteUser', () => {
    it('should trigger hardware removal and delete user from DB', async () => {
      const user = {
        _id: 'user-3',
        tenant: 'tenant-3',
        username: 'todelete',
        serviceType: 'pppoe',
        mikrotikRouter: 'router-1',
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      MikrotikUser.findOne.mockResolvedValue(user);

      await UserService.deleteUser('user-3', 'tenant-3');

      expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('removeUser', {
        username: 'todelete',
        serviceType: 'pppoe',
        routerId: 'router-1',
        tenantId: 'tenant-3',
      });
      expect(user.deleteOne).toHaveBeenCalled();
    });
  });
});