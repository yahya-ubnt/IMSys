const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createMikrotikUser,
  getMikrotikUsers,
} = require('../../controllers/mikrotikUserController');
const Tenant = require('../../models/Tenant');

// Mock UserService
jest.mock('../../services/userService');
const UserService = require('../../services/userService');

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

describe('Mikrotik User Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Tenant.deleteMany({});
    tenant = await Tenant.create({ name: 'MU Tenant' });

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

  describe('createMikrotikUser', () => {
    it('should call UserService.createMikrotikUser', async () => {
      req.body = { officialName: 'John' };
      UserService.createMikrotikUser.mockResolvedValue({ officialName: 'John' });

      await createMikrotikUser(req, res, next);

      expect(UserService.createMikrotikUser).toHaveBeenCalledWith(req.body, tenant._id);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getMikrotikUsers', () => {
      it('should call UserService.getPopulatedMikrotikUsers', async () => {
          UserService.getPopulatedMikrotikUsers.mockResolvedValue([]);
          await getMikrotikUsers(req, res, next);
          expect(UserService.getPopulatedMikrotikUsers).toHaveBeenCalledWith(tenant._id);
          expect(res.status).toHaveBeenCalledWith(200);
      });
  });
});
