const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createTechnicianActivity,
  getTechnicianActivities,
} = require('../../controllers/technicianActivityController');
const TechnicianActivity = require('../../models/TechnicianActivity');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');

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

describe('Technician Activity Controller (Integration)', () => {
  let req, res, next, tenant, tech;

  beforeEach(async () => {
    await TechnicianActivity.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Tech Tenant' });
    tech = await User.create({
        fullName: 'Tech 1',
        email: 't1@test.com',
        password: 'p',
        phone: '123',
        roles: ['ADMIN'],
        tenant: tenant._id
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

  describe('createTechnicianActivity', () => {
    it('should create installation activity successfully', async () => {
      req.body = {
        technician: 'Tech Name',
        activityType: 'Installation',
        clientName: 'Client A',
        clientPhone: '123',
        activityDate: new Date(),
        description: 'Installed router',
        installedEquipment: 'Router X',
        installationNotes: 'Done'
      };

      await createTechnicianActivity(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const activity = await TechnicianActivity.findOne({ clientName: 'Client A' });
      expect(activity).toBeDefined();
    });
  });

  describe('getTechnicianActivities', () => {
      it('should return activities for tenant', async () => {
          await TechnicianActivity.create({
              technician: 'Tech B',
              activityType: 'Support',
              supportCategory: 'Client Problem',
              issueDescription: 'Slow speed',
              solutionProvided: 'Reset',
              clientName: 'Client B',
              clientPhone: '456',
              description: 'Fix',
              tenant: tenant._id,
              activityDate: new Date()
          });

          await getTechnicianActivities(req, res, next);
          if (next.mock.calls.length > 0) {
              console.error('Controller error:', next.mock.calls[0][0]);
          }
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ clientName: 'Client B' })
          ]));
      });
  });
});
