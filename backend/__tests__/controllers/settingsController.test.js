const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getGeneralSettings,
  updateGeneralSettings,
} = require('../../controllers/settingsController');
const ApplicationSettings = require('../../models/ApplicationSettings');
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

describe('Settings Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await ApplicationSettings.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Settings Tenant' });

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

  describe('getGeneralSettings', () => {
    it('should create and return default settings if none exist', async () => {
      await getGeneralSettings(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ appName: 'MEDIATEK' }));
      const s = await ApplicationSettings.findOne({ tenant: tenant._id });
      expect(s).toBeDefined();
    });
  });

  describe('updateGeneralSettings', () => {
      it('should update settings successfully', async () => {
          await ApplicationSettings.create({ tenant: tenant._id });
          req.body = { appName: 'New App Name' };

          await updateGeneralSettings(req, res, next);
          const updated = await ApplicationSettings.findOne({ tenant: tenant._id });
          expect(updated.appName).toBe('New App Name');
      });
  });
});
