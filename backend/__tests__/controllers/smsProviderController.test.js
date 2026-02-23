const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createSmsProvider,
  getSmsProviders,
} = require('../../controllers/smsProviderController');
const SmsProvider = require('../../models/SmsProvider');
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

describe('SMS Provider Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await SmsProvider.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Provider Tenant' });

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

  describe('createSmsProvider', () => {
    it('should create a provider successfully', async () => {
      req.body = {
        name: 'Twilio',
        providerType: 'twilio',
        credentials: { accountSid: '123', authToken: 'abc' },
        isActive: true
      };

      await createSmsProvider(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const p = await SmsProvider.findOne({ name: 'Twilio' });
      expect(p).toBeDefined();
    });
  });

  describe('getSmsProviders', () => {
      it('should return all providers for tenant without credentials', async () => {
          await SmsProvider.create({
              name: 'Celcom',
              providerType: 'celcom',
              credentials: { apiKey: 'xyz' },
              tenant: tenant._id,
              isActive: true
          });

          await getSmsProviders(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'Celcom' })
          ]));
          // Verify credentials are removed in sanitized object
          const lastCall = res.json.mock.calls[0][0];
          expect(lastCall[0].credentials).toBeUndefined();
      });
  });
});
