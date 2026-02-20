const {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
} = require('../../controllers/reportController');
const MikrotikUser = require('../../models/MikrotikUser');
const MpesaAlert = require('../../models/MpesaAlert');
const Transaction = require('../../models/Transaction');
const { validationResult } = require('express-validator');

jest.mock('../../models/MikrotikUser');
jest.mock('../../models/MpesaAlert');
jest.mock('../../models/Transaction');
jest.mock('express-validator');

describe('Report Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
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

  describe('getLocationReport', () => {
    it('should return a location-based revenue report', async () => {
      req.body = { startDate: '2024-01-01', endDate: '2024-01-31', apartment_house_number: 'A101' };
      const mockUsers = [
        { officialName: 'John Doe', serviceType: 'Internet', mPesaRefNo: 'REF1', package: { price: 1000 } },
      ];
      MikrotikUser.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUsers),
      });

      await getLocationReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reportData: expect.any(Array),
        totalAmount: 1000,
      }));
    });
  });

  describe('getMpesaAlerts', () => {
    it('should return all M-Pesa alerts', async () => {
      const mockAlerts = [{ _id: 'alert1' }];
      MpesaAlert.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAlerts),
      });

      await getMpesaAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAlerts);
    });
  });

  describe('deleteMpesaAlert', () => {
    it('should delete an M-Pesa alert', async () => {
      const mockAlert = { _id: 'alert1', deleteOne: jest.fn() };
      MpesaAlert.findOne.mockResolvedValue(mockAlert);

      await deleteMpesaAlert(req, res);

      expect(MpesaAlert.findOne).toHaveBeenCalledWith({ _id: 'testId', tenant: 'testTenant' });
      expect(mockAlert.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Alert removed' });
    });

    it('should call next with an error if alert not found', async () => {
      MpesaAlert.findOne.mockResolvedValue(null);

      await deleteMpesaAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(new Error('Alert not found'));
    });
  });

  describe('getMpesaReport', () => {
    it('should return an M-Pesa report', async () => {
      req.body = { startDate: '2024-01-01', endDate: '2024-01-31' };
      const mockTransactions = [
        { transactionId: 'T1', officialName: 'Jane Doe', amount: 500, transactionDate: new Date() },
      ];
      Transaction.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTransactions),
      });

      await getMpesaReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reportData: expect.any(Array),
        totalAmount: 500,
      }));
    });
  });
});
