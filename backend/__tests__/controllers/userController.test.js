const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  loginUser,
  logoutUser,
  getUserProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTenantUsers,
  createTenantUser,
  getTenantUserById,
  updateTenantUser,
  deleteTenantUser,
} = require('../../controllers/userController');
const User = require('../../models/User');
const Tenant = require('../../models/Tenant');
const generateToken = require('../../generateToken');

jest.mock('../../generateToken');

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

describe('User Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await User.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Test Tenant' });

    req = {
      params: {},
      user: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should log in user and return token', async () => {
      const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        roles: ['ADMIN'],
        tenant: tenant._id,
      });

      req.body = { email: 'test@example.com', password: 'password123' };
      generateToken.mockReturnValue('mockToken');

      await loginUser(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('token', 'mockToken', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        fullName: 'Test User'
      }));
    });

    it('should throw error for invalid credentials', async () => {
        req.body = { email: 'wrong@example.com', password: 'wrong' };
        await loginUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const user = await User.create({
        fullName: 'Profile User',
        email: 'profile@example.com',
        password: 'password',
        phone: '111',
        roles: ['ADMIN'],
        tenant: tenant._id,
      });

      req.user = { id: user._id };
      await getUserProfile(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'profile@example.com' }));
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      await User.create({
        fullName: 'User 1',
        email: 'u1@example.com',
        password: 'p1',
        phone: '1',
        roles: ['SUPER_ADMIN']
      });

      await getUsers(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ email: 'u1@example.com' })
      ]));
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      req.body = {
        fullName: 'New User',
        email: 'new@example.com',
        password: 'password',
        phone: '222',
        roles: ['ADMIN'],
        tenant: tenant._id
      };

      await createUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      const user = await User.findOne({ email: 'new@example.com' });
      expect(user).toBeDefined();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com' }));
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
        const user = await User.create({
            fullName: 'Old Name',
            email: 'old@example.com',
            password: 'password',
            phone: '333',
            roles: ['ADMIN'],
            tenant: tenant._id,
        });

        req.params.id = user._id;
        req.body = { fullName: 'Updated Name' };

        await updateUser(req, res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Updated Name' }));
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.fullName).toBe('Updated Name');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
        const user = await User.create({
            fullName: 'Delete Me',
            email: 'delete@example.com',
            password: 'password',
            phone: '444',
            roles: ['ADMIN'],
            tenant: tenant._id,
        });

        req.params.id = user._id;
        await deleteUser(req, res, next);
        expect(res.json).toHaveBeenCalledWith({ message: 'User removed' });
        const deletedUser = await User.findById(user._id);
        expect(deletedUser).toBeNull();
    });
  });

  describe('Tenant Operations', () => {
      let tenantUser;

      beforeEach(async () => {
          tenantUser = await User.create({
              fullName: 'Tenant User',
              email: 'tenant@example.com',
              password: 'password',
              phone: '555',
              roles: ['ADMIN'],
              tenant: tenant._id,
          });
          req.user = { tenant: tenant._id };
      });

      it('should get tenant users', async () => {
          await getTenantUsers(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ email: 'tenant@example.com' })
          ]));
      });

      it('should create tenant user', async () => {
          req.body = {
              fullName: 'New Tenant User',
              email: 'newtenant@example.com',
              password: 'password',
              phone: '666'
          };
          await createTenantUser(req, res, next);
          expect(res.status).toHaveBeenCalledWith(201);
          const user = await User.findOne({ email: 'newtenant@example.com' });
          expect(user.tenant.toString()).toBe(tenant._id.toString());
      });

      it('should update tenant user', async () => {
          req.params.id = tenantUser._id;
          req.body = { fullName: 'Updated Tenant User' };
          await updateTenantUser(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Updated Tenant User' }));
      });

      it('should delete tenant user', async () => {
          req.params.id = tenantUser._id;
          await deleteTenantUser(req, res, next);
          expect(res.json).toHaveBeenCalledWith({ message: 'User removed' });
          const deleted = await User.findById(tenantUser._id);
          expect(deleted).toBeNull();
      });
  });
});
