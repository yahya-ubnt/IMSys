const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createLead,
  getAllLeads,
} = require('../../controllers/leadController');
const Lead = require('../../models/Lead');
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

describe('Lead Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Lead.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Lead Tenant' });

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

  describe('createLead', () => {
    it('should create a lead successfully', async () => {
      req.body = {
        name: 'Prospect John',
        phoneNumber: '123',
        leadSource: 'Website'
      };

      await createLead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const lead = await Lead.findOne({ name: 'Prospect John' });
      expect(lead).toBeDefined();
    });
  });

  describe('getAllLeads', () => {
      it('should return leads and stats', async () => {
          await Lead.create({
              name: 'L1',
              phoneNumber: '1',
              leadSource: 'Website',
              tenant: tenant._id,
              status: 'New'
          });

          await getAllLeads(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
              leads: expect.arrayContaining([
                  expect.objectContaining({ name: 'L1' })
              ]),
              dashboardStats: expect.objectContaining({ totalLeads: 1 })
          }));
      });
  });
});
