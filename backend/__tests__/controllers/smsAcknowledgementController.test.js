const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createAcknowledgement,
  getAcknowledgements,
} = require('../../controllers/smsAcknowledgementController');
const SmsAcknowledgement = require('../../models/SmsAcknowledgement');
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

describe('SMS Acknowledgement Controller (Integration)', () => {
  let req, res, next, tenant, template;

  beforeEach(async () => {
    await SmsAcknowledgement.deleteMany({});
    await SmsTemplate.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'SMS Ack Tenant' });
    template = await SmsTemplate.create({
        name: 'Welcome',
        messageBody: 'Welcome {name}',
        tenant: tenant._id
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

  describe('createAcknowledgement', () => {
    it('should create mapping successfully', async () => {
      req.body = {
        triggerType: 'USER_CREATED',
        smsTemplate: template._id.toString(),
        status: 'Active'
      };

      await createAcknowledgement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const ack = await SmsAcknowledgement.findOne({ triggerType: 'USER_CREATED' });
      expect(ack).toBeDefined();
    });
  });

  describe('getAcknowledgements', () => {
      it('should return mappings for tenant', async () => {
          await SmsAcknowledgement.create({
              triggerType: 'TEST',
              smsTemplate: template._id,
              tenant: tenant._id,
              status: 'Active'
          });

          await getAcknowledgements(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ triggerType: 'TEST' })
          ]));
      });
  });
});
