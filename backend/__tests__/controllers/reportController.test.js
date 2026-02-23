const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getLocationReport,
  getMpesaAlerts,
} = require('../../controllers/reportController');
const MikrotikUser = require('../../models/MikrotikUser');
const Package = require('../../models/Package');
const MpesaAlert = require('../../models/MpesaAlert');
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

describe('Report Controller (Integration)', () => {
  let req, res, next, tenant, user, pkg;

  beforeEach(async () => {
    await MikrotikUser.deleteMany({});
    await Package.deleteMany({});
    await MpesaAlert.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Report Tenant' });
    pkg = await Package.create({
        name: 'P1',
        price: 1000,
        serviceType: 'pppoe',
        status: 'active',
        profile: 'p1',
        mikrotikRouter: new mongoose.Types.ObjectId(),
        tenant: tenant._id
    });
    user = await MikrotikUser.create({
        officialName: 'John',
        username: 'john',
        email: 'j@t.com',
        phone: '1',
        mPesaRefNo: 'R1',
        serviceType: 'pppoe',
        package: pkg._id,
        mikrotikRouter: new mongoose.Types.ObjectId(),
        tenant: tenant._id,
        billingCycle: 'Monthly',
        mobileNumber: '1',
        expiryDate: new Date(),
        apartment_house_number: 'A1'
    });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getLocationReport', () => {
    it('should return report data for location', async () => {
      req.body = {
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        apartment_house_number: 'A1'
      };

      await getLocationReport(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          totalAmount: 1000,
          reportData: expect.arrayContaining([
              expect.objectContaining({ 'Official Name': 'John' })
          ])
      }));
    });
  });

  describe('getMpesaAlerts', () => {
      it('should return alerts for tenant', async () => {
          await MpesaAlert.create({
              message: 'Alert 1',
              transactionId: 'T1',
              amount: 100,
              referenceNumber: 'R1',
              tenant: tenant._id,
              paymentDate: new Date()
          });

          await getMpesaAlerts(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ message: 'Alert 1' })
          ]));
      });
  });
});
