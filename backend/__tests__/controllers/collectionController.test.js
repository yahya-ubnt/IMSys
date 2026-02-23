const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
} = require('../../controllers/collectionController');
const Transaction = require('../../models/Transaction');
const Tenant = require('../../models/Tenant');
const MikrotikUser = require('../../models/MikrotikUser');
const moment = require('moment-timezone');

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

describe('Collection Controller (Integration)', () => {
  let req, res, next, tenant, user;

  beforeEach(async () => {
    await Transaction.deleteMany({});
    await Tenant.deleteMany({});
    await MikrotikUser.deleteMany({});

    tenant = await Tenant.create({ name: 'Collection Tenant' });
    user = await MikrotikUser.create({
        fullName: 'Test Client', // Wait, model says officialName? 
        officialName: 'Test Client',
        username: 'client1',
        email: 'client@test.com',
        phone: '123',
        mPesaRefNo: 'REF123',
        serviceType: 'pppoe',
        package: new mongoose.Types.ObjectId(),
        mikrotikRouter: new mongoose.Types.ObjectId(),
        tenant: tenant._id,
        billingCycle: 'Monthly',
        mobileNumber: '123',
        expiryDate: new Date()
    });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCollections', () => {
    it('should return all collections for the tenant', async () => {
      await Transaction.create({
        transactionId: 'TX1',
        amount: 1000,
        referenceNumber: 'REF1',
        officialName: 'John',
        paymentMethod: 'M-Pesa',
        tenant: tenant._id,
        mikrotikUser: user._id,
        transactionDate: new Date(),
        msisdn: '123'
      });

      await getCollections(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ transactionId: 'TX1' })
      ]));
    });
  });

  describe('getCollectionStats', () => {
    it('should return correct collection statistics', async () => {
        const today = new Date();
        await Transaction.create({
            transactionId: 'TX_TODAY',
            amount: 500,
            referenceNumber: 'R1',
            officialName: 'O1',
            paymentMethod: 'Cash',
            tenant: tenant._id,
            transactionDate: today,
            msisdn: '123'
        });

        await getCollectionStats(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            today: 500
        }));
    });
  });

  describe('getMonthlyCollectionTotals', () => {
      it('should return monthly totals for a given year', async () => {
          const year = '2024';
          await Transaction.create({
              transactionId: 'TX_JAN',
              amount: 1000,
              referenceNumber: 'R2',
              officialName: 'O2',
              paymentMethod: 'Cash',
              tenant: tenant._id,
              transactionDate: new Date(2024, 0, 15), // Jan 15
              msisdn: '123'
          });

          req.query = { year };
          await getMonthlyCollectionTotals(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ month: 1, total: 1000 }),
              expect.objectContaining({ month: 2, total: 0 })
          ]));
      });
  });
});
