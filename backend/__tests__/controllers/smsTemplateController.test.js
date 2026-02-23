const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createTemplate,
  getTemplates,
} = require('../../controllers/smsTemplateController');
const SmsTemplate = require('../../models/SmsTemplate');
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

describe('SMS Template Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await SmsTemplate.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Template Tenant' });

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

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      req.body = { name: 'Promo', messageBody: 'Buy now!' };

      await createTemplate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const t = await SmsTemplate.findOne({ name: 'Promo' });
      expect(t).toBeDefined();
    });
  });

  describe('getTemplates', () => {
      it('should return templates for tenant', async () => {
          await SmsTemplate.create({
              name: 'T1',
              messageBody: 'B1',
              tenant: tenant._id
          });

          await getTemplates(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'T1' })
          ]));
      });
  });
});
