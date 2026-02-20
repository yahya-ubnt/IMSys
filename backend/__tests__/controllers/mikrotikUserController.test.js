const {
  createMikrotikUser,
  getMikrotikUsers,
  getMikrotikUserById,
  updateMikrotikUser,
  deleteMikrotikUser,
  getMikrotikClientsForSms,
  getMonthlyNewSubscribers,
  getMonthlyPaidSubscribers,
  getMonthlyTotalSubscribers,
  getMikrotikUserStatus,
  getMikrotikUserTraffic,
  getDowntimeLogs,
  getDelayedPayments,
  getUserPaymentStats,
  getMikrotikUsersByStation,
  manualDisconnectUser,
  manualConnectUser,
} = require('../../controllers/mikrotikUserController');
const MikrotikUser = require('../../models/MikrotikUser');
const Package = require('../../models/Package');
const MikrotikRouter = require('../../models/MikrotikRouter');
const UserService = require('../../services/userService');
const UserDowntimeLog = require('../../models/UserDowntimeLog');
const Transaction = require('../../models/Transaction');
const mikrotikUtils = require('../../utils/mikrotikUtils');
const crypto = require('../../utils/crypto');
const { validationResult } = require('express-validator');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

jest.mock('../../models/MikrotikUser');
jest.mock('../../models/Package');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../services/userService');
jest.mock('../../models/UserDowntimeLog');
jest.mock('../../models/Transaction');
jest.mock('../../utils/mikrotikUtils');
jest.mock('../../utils/crypto');
jest.mock('express-validator');
jest.mock('node-routeros');
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('Mikrotik User Controller', () => {
  let req, res, next;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    req = {
      params: { id: 'testId', userId: 'testUserId', year: '2024', stationId: 'testStationId' },
      user: { tenant: 'testTenant' },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMikrotikUser', () => {
    it('should create a new Mikrotik User', async () => {
      const userData = { username: 'testuser' };
      req.body = userData;
      UserService.createMikrotikUser.mockResolvedValue(userData);
      await createMikrotikUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(userData);
    });
  });

  describe('getMikrotikUsers', () => {
    it('should return all Mikrotik Users', async () => {
      const mockUsers = [{ _id: 'u1' }];
      UserService.getPopulatedMikrotikUsers.mockResolvedValue(mockUsers);
      await getMikrotikUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('getMikrotikUserById', () => {
    it('should return a single Mikrotik User by ID', async () => {
      const mockUser = { _id: 'u1' };
      UserService.getPopulatedMikrotikUserById.mockResolvedValue(mockUser);
      await getMikrotikUserById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateMikrotikUser', () => {
    it('should update a Mikrotik User', async () => {
      const userData = { username: 'updateduser' };
      req.body = userData;
      UserService.updateUser.mockResolvedValue(userData);
      await updateMikrotikUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(userData);
    });
  });

  describe('deleteMikrotikUser', () => {
    it('should delete a Mikrotik User', async () => {
      UserService.deleteUser.mockResolvedValue(true);
      await deleteMikrotikUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mikrotik User removal initiated' });
    });
  });

  describe('manualDisconnectUser', () => {
    it('should manually disconnect a user', async () => {
      const mockUser = { _id: 'u1' };
      UserService.updateUser.mockResolvedValue(mockUser);
      await manualDisconnectUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'User disconnection initiated successfully', user: mockUser });
    });
  });

  describe('manualConnectUser', () => {
    it('should manually connect a user', async () => {
      const mockUser = { _id: 'u1' };
      UserService.updateUser.mockResolvedValue(mockUser);
      await manualConnectUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'User connection initiated successfully', user: mockUser });
    });
  });

  describe('getMikrotikClientsForSms', () => {
    it('should return Mikrotik Clients for SMS', async () => {
      const mockClients = [{ _id: 'c1' }];
      UserService.getMikrotikClientsForSms.mockResolvedValue(mockClients);
      await getMikrotikClientsForSms(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockClients);
    });
  });

  describe('getMonthlyNewSubscribers', () => {
    it('should return count of new subscribers for the current month', async () => {
      UserService.getMonthlyNewSubscribers.mockResolvedValue({ count: 10 });
      await getMonthlyNewSubscribers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 10 });
    });
  });

  describe('getMonthlyPaidSubscribers', () => {
    it('should return count of paid subscribers for the current month', async () => {
      UserService.getMonthlyPaidSubscribers.mockResolvedValue({ count: 5 });
      await getMonthlyPaidSubscribers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });
  });

  describe('getMonthlyTotalSubscribers', () => {
    it('should return monthly total subscribers for a given year', async () => {
      const mockMonthlyTotals = [{ month: 1, total: 20 }];
      UserService.getMonthlyTotalSubscribers.mockResolvedValue(mockMonthlyTotals);
      await getMonthlyTotalSubscribers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMonthlyTotals);
    });
  });

  describe('getMikrotikUserStatus', () => {
    it('should return Mikrotik User Status', async () => {
      UserService.getMikrotikUserStatus.mockResolvedValue({ status: 'online' });
      await getMikrotikUserStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'online' });
    });
  });

  describe('getMikrotikUserTraffic', () => {
    it('should return Mikrotik User Traffic Statistics', async () => {
      const mockTrafficData = { rxRate: 125, txRate: 62.5, rxBytes: 0, txBytes: 0 };
      UserService.getMikrotikUserTraffic.mockResolvedValue(mockTrafficData);
      await getMikrotikUserTraffic(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTrafficData);
    });
  });

  describe('getDowntimeLogs', () => {
    it('should return Downtime Logs for a Mikrotik User', async () => {
      const mockLogs = [{ _id: 'l1' }];
      UserService.getDowntimeLogs.mockResolvedValue(mockLogs);
      await getDowntimeLogs(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLogs);
    });
  });

  describe('getDelayedPayments', () => {
    it('should return users with delayed payments', async () => {
      const mockUsers = [{ _id: 'u1', daysOverdue: 2 }];
      UserService.getDelayedPayments.mockResolvedValue(mockUsers);
      req.query = { days_overdue: '1', name_search: 'test' };
      await getDelayedPayments(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('getUserPaymentStats', () => {
    it('should return payment statistics for a single Mikrotik User', async () => {
      const mockStats = { totalSpentMpesa: 100 };
      UserService.getUserPaymentStats.mockResolvedValue(mockStats);
      await getUserPaymentStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ totalSpentMpesa: 100 }));
    });
  });

  describe('getMikrotikUsersByStation', () => {
    it('should return all Mikrotik Users for a specific station', async () => {
      const mockUsers = [{ _id: 'u1' }];
      UserService.getMikrotikUsersByStation.mockResolvedValue(mockUsers);
      await getMikrotikUsersByStation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });
});
