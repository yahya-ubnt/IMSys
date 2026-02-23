const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createInvoice,
  getInvoices,
  getInvoiceStats,
} = require('../../controllers/invoiceController');
const Invoice = require('../../models/Invoice');
const MikrotikUser = require('../../models/MikrotikUser');
const Tenant = require('../../models/Tenant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Invoice Controller (Integration)', () => {
  let req, res, next, tenant, user;

  beforeEach(async () => {
    await Invoice.deleteMany({});
    await MikrotikUser.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Invoice Tenant' });
    user = await MikrotikUser.create({
        officialName: 'Customer 1',
        username: 'cust1',
        email: 'c1@test.com',
        phone: '1',
        mPesaRefNo: 'R1',
        serviceType: 'pppoe',
        package: new mongoose.Types.ObjectId(),
        mikrotikRouter: new mongoose.Types.ObjectId(),
        tenant: tenant._id,
        billingCycle: 'Monthly',
        mobileNumber: '1',
        expiryDate: new Date(),
        walletBalance: 0
    });

    req = {
      params: {},
      user: { tenant: tenant._id, roles: ['ADMIN'] },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should create invoice and update wallet', async () => {
      req.body = {
        mikrotikUserId: user._id.toString(),
        amount: 500,
        dueDate: new Date(),
        items: [{ description: 'Internet', amount: 500 }]
      };

      await createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const updatedUser = await MikrotikUser.findById(user._id);
      expect(updatedUser.walletBalance).toBe(-500);
      const invoice = await Invoice.findOne({ mikrotikUser: user._id });
      expect(invoice).toBeDefined();
    });
  });

  describe('getInvoiceStats', () => {
      it('should return correct stats', async () => {
          await Invoice.create({
              invoiceNumber: 'INV-1',
              mikrotikUser: user._id,
              tenant: tenant._id,
              amount: 1000,
              status: 'Unpaid',
              dueDate: new Date(),
              items: []
          });

          await getInvoiceStats(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
              unpaid: 1,
              totalUnpaidAmount: 1000
          }));
      });
  });
});
