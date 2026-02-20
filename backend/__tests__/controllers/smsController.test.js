const {
  getSmsTriggers,
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
  getSmsLogsForUserController,
} = require('../../controllers/smsController');
const smsService = require('../../services/smsService');
const smsTriggers = require('../../constants/smsTriggers');

jest.mock('../../services/smsService');

describe('SMS Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { userId: 'testUserId' },
      user: { tenant: 'testTenant' },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      header: jest.fn(),
      attachment: jest.fn(),
      send: jest.fn(),
      pipe: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSmsTriggers', () => {
    it('should return available SMS trigger types', async () => {
      await getSmsTriggers(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('composeAndSendSms', () => {
    it('should send an SMS', async () => {
      req.body = { message: 'Test SMS', sendToType: 'user', userIds: ['user1'] };
      smsService.sendBulkSms.mockResolvedValue([{ success: true }]);
      await composeAndSendSms(req, res);
      expect(smsService.sendBulkSms).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'SMS sending process completed.', logs: [{ success: true }] });
    });
  });

  describe('getSentSmsLog', () => {
    it('should return SMS logs', async () => {
      const mockLogs = { logs: [{ _id: 'log1' }], pages: 1 };
      smsService.getSmsLogs.mockResolvedValue(mockLogs);
      await getSentSmsLog(req, res);
      expect(smsService.getSmsLogs).toHaveBeenCalledWith('testTenant', req.query);
      expect(res.json).toHaveBeenCalledWith(mockLogs);
    });
  });

  describe('exportSmsLogs', () => {
    it('should export SMS logs to CSV', async () => {
      const mockLogs = { logs: [{ mobileNumber: '123', message: 'test', smsStatus: 'sent', createdAt: new Date() }] };
      smsService.getSmsLogs.mockResolvedValue(mockLogs);
      req.query.format = 'csv';
      await exportSmsLogs(req, res);
      expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.attachment).toHaveBeenCalledWith('sms_logs.csv');
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getSmsLogsForUserController', () => {
    it('should return SMS logs for a user', async () => {
      const mockLogs = { logs: [{ _id: 'log1' }] };
      smsService.getSmsLogsForUser.mockResolvedValue(mockLogs);
      await getSmsLogsForUserController(req, res);
      expect(smsService.getSmsLogsForUser).toHaveBeenCalledWith('testUserId', 'testTenant');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLogs);
    });
  });
});
