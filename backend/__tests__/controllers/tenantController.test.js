const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createTenant,
  getTenants,
} = require('../../controllers/tenantController');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');

// Mock scheduledTaskService because it creates default tasks
jest.mock('../../services/scheduledTaskService', () => ({
    createDefaultTasksForTenant: jest.fn().mockResolvedValue(true)
}));

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

describe('Tenant Controller (Integration)', () => {
  let req, res, next;

  beforeEach(async () => {
    await Tenant.deleteMany({});
    await User.deleteMany({});

    req = {
      params: {},
      user: { roles: ['SUPER_ADMIN'] },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create tenant and admin user successfully', async () => {
      req.body = {
        tenantName: 'New ISP',
        fullName: 'Admin John',
        email: 'admin@isp.com',
        password: 'password',
        phone: '123'
      };

      await createTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const tenant = await Tenant.findOne({ name: 'New ISP' });
      expect(tenant).toBeDefined();
      const user = await User.findOne({ email: 'admin@isp.com' });
      expect(user).toBeDefined();
      expect(user.tenant.toString()).toBe(tenant._id.toString());
    });
  });

  describe('getTenants', () => {
      it('should return all tenants', async () => {
          await Tenant.create({ name: 'ISP 1' });
          await getTenants(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'ISP 1' })
          ]));
      });
  });
});
