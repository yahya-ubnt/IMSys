const {
  getInvoices,
  getInvoiceById,
  getInvoiceStats,
  createInvoice,
  payInvoice,
  downloadInvoicePDF,
} = require('../../controllers/invoiceController');
const Invoice = require('../../models/Invoice');
const MikrotikUser = require('../../models/MikrotikUser');
const WalletTransaction = require('../../models/WalletTransaction');
const ApplicationSettings = require('../../models/ApplicationSettings');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');
const mongoose = require('mongoose');

jest.mock('../../models/Invoice');
jest.mock('../../models/MikrotikUser');
jest.mock('../../models/WalletTransaction');
jest.mock('../../models/ApplicationSettings');
jest.mock('../../utils/pdfGenerator');

describe('Invoice Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testInvoiceId' },
      user: { _id: 'testUserId', tenant: 'testTenant', roles: ['USER'] },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      setHeader: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInvoices', () => {
    it('should return user-specific invoices if not admin', async () => {
      const mockMikrotikUser = { _id: 'mikrotikUserId', user: 'testUserId' };
      const mockInvoices = [{ _id: 'inv1' }];
      MikrotikUser.findOne.mockResolvedValue(mockMikrotikUser);
      const mockFindResult = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockInvoices),
      };
      Invoice.find.mockReturnValue(mockFindResult);

      await getInvoices(req, res);

      expect(MikrotikUser.findOne).toHaveBeenCalledWith({ user: 'testUserId' });
      expect(Invoice.find).toHaveBeenCalledWith({ mikrotikUser: 'mikrotikUserId' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInvoices);
    });

    it('should return all tenant invoices if admin', async () => {
      req.user.roles = ['ADMIN'];
      const mockInvoices = [{ _id: 'inv1' }, { _id: 'inv2' }];
      const mockFindResult = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockInvoices),
      };
      Invoice.find.mockReturnValue(mockFindResult);

      await getInvoices(req, res);

      expect(Invoice.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInvoices);
    });

    it('should return empty array if user is not mikrotik customer', async () => {
      MikrotikUser.findOne.mockResolvedValue(null);

      await getInvoices(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getInvoiceById', () => {
    it('should return a single invoice for owner', async () => {
      const mikrotikUserId = new mongoose.Types.ObjectId();
      const mockMikrotikUser = { _id: mikrotikUserId, user: 'testUserId' };
      const mockInvoice = { _id: 'testInvoiceId', mikrotikUser: mikrotikUserId, tenant: 'testTenant', equals: jest.fn((id) => id.equals(mikrotikUserId)) };
      MikrotikUser.findOne.mockResolvedValue(mockMikrotikUser);
      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(mockInvoice);

      await getInvoiceById(req, res);

      expect(Invoice.findById).toHaveBeenCalledWith('testInvoiceId');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInvoice);
    });

    it('should return a single invoice for admin', async () => {
      req.user.roles = ['ADMIN'];
      const otherMikrotikUserId = new mongoose.Types.ObjectId();
      const mockInvoice = { _id: 'testInvoiceId', mikrotikUser: otherMikrotikUserId, tenant: 'testTenant', equals: jest.fn((id) => id.equals(otherMikrotikUserId)) };
      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(mockInvoice);

      await getInvoiceById(req, res);

      expect(Invoice.findById).toHaveBeenCalledWith('testInvoiceId');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInvoice);
    });

    it('should return 404 if invoice not found', async () => {
      const mockMikrotikUser = { _id: 'mikrotikUserId', user: 'testUserId' };
      MikrotikUser.findOne.mockResolvedValue(mockMikrotikUser);
      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(null);

      await getInvoiceById(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Invoice not found'));
    });

    it('should return 403 if not authorized', async () => {
      const mikrotikUserId = new mongoose.Types.ObjectId();
      const otherMikrotikUserId = new mongoose.Types.ObjectId();
      const mockMikrotikUser = { _id: mikrotikUserId, user: 'testUserId' };
      const mockInvoice = { _id: 'testInvoiceId', mikrotikUser: otherMikrotikUserId, tenant: 'otherTenant', equals: jest.fn((id) => id.equals(otherMikrotikUserId)) };
      MikrotikUser.findOne.mockResolvedValue(mockMikrotikUser);
      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(mockInvoice);

      await getInvoiceById(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Not authorized to view this invoice'));
    });
  });

  describe('getInvoiceStats', () => {
    it('should return invoice statistics for admin', async () => {
      req.user.roles = ['ADMIN'];
      req.user.tenant = new mongoose.Types.ObjectId().toString(); // Add this line
      Invoice.countDocuments.mockResolvedValueOnce(10) // total
                            .mockResolvedValueOnce(3)  // unpaid
                            .mockResolvedValueOnce(2); // overdue
      Invoice.aggregate.mockResolvedValue([{ _id: null, total: 500 }]);

      await getInvoiceStats(req, res);

      expect(Invoice.countDocuments).toHaveBeenCalledTimes(3);
      expect(Invoice.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        total: 10,
        unpaid: 3,
        overdue: 2,
        totalUnpaidAmount: 500,
      });
    });
  });

  describe('createInvoice', () => {
    it('should create a manual invoice and update wallet', async () => {
      req.user.roles = ['ADMIN'];
      const invoiceData = {
        mikrotikUserId: 'mikrotikUserId',
        amount: 100,
        dueDate: new Date(),
        items: [{ name: 'Service', price: 100 }],
      };
      req.body = invoiceData;

      const mockMikrotikUser = {
        _id: 'mikrotikUserId',
        tenant: 'testTenant',
        walletBalance: 500,
        save: jest.fn(),
      };
      const mockInvoice = { _id: 'newInvoiceId', ...invoiceData, tenant: 'testTenant' };

      MikrotikUser.findById.mockResolvedValue(mockMikrotikUser);
      Invoice.create.mockResolvedValue(mockInvoice);
      WalletTransaction.create.mockResolvedValue({});

      await createInvoice(req, res);

      expect(MikrotikUser.findById).toHaveBeenCalledWith('mikrotikUserId');
      expect(Invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        mikrotikUser: 'mikrotikUserId',
        amount: 100,
        tenant: 'testTenant',
        status: 'Unpaid',
      }));
      expect(WalletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        mikrotikUser: 'mikrotikUserId',
        type: 'Debit',
        amount: 100,
        balanceAfter: 400,
      }));
      expect(mockMikrotikUser.walletBalance).toBe(400);
      expect(mockMikrotikUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockInvoice);
    });

    it('should return 400 if required fields are missing', async () => {
      req.user.roles = ['ADMIN'];
      req.body = { amount: 100 }; // Missing mikrotikUserId, dueDate, items

      await createInvoice(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Please provide all required fields: mikrotikUserId, amount, dueDate, and items'));
    });

    it('should return 404 if mikrotik user not found', async () => {
      req.user.roles = ['ADMIN'];
      req.body = {
        mikrotikUserId: 'nonExistentUser',
        amount: 100,
        dueDate: new Date(),
        items: [{ name: 'Service', price: 100 }],
      };
      MikrotikUser.findById.mockResolvedValue(null);

      await createInvoice(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Mikrotik user not found'));
    });
  });

  describe('payInvoice', () => {
    it('should return 501 for not implemented', async () => {
      await payInvoice(req, res);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Payment gateway not implemented.' });
    });
  });

  describe('downloadInvoicePDF', () => {
    it('should download invoice PDF', async () => {
      const mockInvoice = {
        _id: 'testInvoiceId',
        tenant: 'testTenant',
        mikrotikUser: { officialName: 'Test User', mobileNumber: '123', emailAddress: 'test@example.com' },
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnThis(),
      };
      const mockSettings = { toObject: jest.fn(() => ({ companyName: 'Test Co' })) };

      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(mockInvoice);
      ApplicationSettings.findOne.mockResolvedValue(mockSettings);
      generateInvoicePDF.mockImplementation((invoice, settings, response) => {
        response.setHeader('Content-Type', 'application/pdf');
        response.send('PDF Content');
      });

      await downloadInvoicePDF(req, res);

      expect(Invoice.findById).toHaveBeenCalledWith('testInvoiceId');
      expect(ApplicationSettings.findOne).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(generateInvoicePDF).toHaveBeenCalledWith(mockInvoice, mockSettings.toObject(), res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalledWith('PDF Content');
    });

    it('should return 404 if invoice not found', async () => {
      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(null);

      await downloadInvoicePDF(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Invoice not found'));
    });

    it('should return 403 if not authorized', async () => {
      const mockInvoice = { _id: 'testInvoiceId', tenant: 'otherTenant' };
      Invoice.findById.mockReturnThis();
      Invoice.populate.mockResolvedValue(mockInvoice);

      await downloadInvoicePDF(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Not authorized to view this invoice'));
    });
  });
});