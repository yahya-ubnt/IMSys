const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getSessionStatus,
} = require('../../controllers/hotspotSessionController');
const HotspotSession = require('../../models/HotspotSession');
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

describe('Hotspot Session Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await HotspotSession.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Session Tenant' });

    req = {
      params: { macAddress: 'AA:BB:CC:DD:EE:FF' },
      user: { tenant: tenant._id },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getSessionStatus', () => {
    it('should return session if active', async () => {
      await HotspotSession.create({
        macAddress: 'AA:BB:CC:DD:EE:FF',
        tenant: tenant._id,
        endTime: new Date(Date.now() + 3600000), // 1 hour later
        startTime: new Date(),
        dataUsage: 0,
        planId: new mongoose.Types.ObjectId()
      });

      await getSessionStatus(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ macAddress: 'AA:BB:CC:DD:EE:FF' }));
    });

    it('should delete and return 404 if session expired', async () => {
        await HotspotSession.create({
            macAddress: 'AA:BB:CC:DD:EE:FF',
            tenant: tenant._id,
            endTime: new Date(Date.now() - 3600000), // 1 hour ago
            startTime: new Date(Date.now() - 7200000),
            dataUsage: 100,
            planId: new mongoose.Types.ObjectId()
        });

        await getSessionStatus(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        const session = await HotspotSession.findOne({ macAddress: 'AA:BB:CC:DD:EE:FF' });
        expect(session).toBeNull();
    });
  });
});
