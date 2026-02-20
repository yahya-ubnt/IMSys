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
const generateToken = require('../../generateToken');

jest.mock('../../models/User', () => {
  const mockUserInstance = {
    save: jest.fn(),
    matchPassword: jest.fn(),
    deleteOne: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };
  const mockUser = jest.fn(function(data) {
    Object.assign(this, data);
    this.save = mockUserInstance.save;
    this.matchPassword = mockUserInstance.matchPassword;
    this.deleteOne = mockUserInstance.deleteOne;
    this.select = mockUserInstance.select;
  });
  mockUser.findOne = jest.fn(() => mockUserInstance);
  mockUser.findById = jest.fn(() => mockUserInstance);
  mockUser.create = jest.fn(() => mockUserInstance);
  mockUser.find = jest.fn(() => [mockUserInstance]);
  return mockUser;
});
jest.mock('../../generateToken');

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
      user: { id: 'testId', tenant: 'testTenant' },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should log in user and return token', async () => {
      req.body = { email: 'test@example.com', password: 'password' };
      const mockUser = { _id: 'u1', email: 'test@example.com', matchPassword: jest.fn().mockResolvedValue(true), roles: ['USER'], tenant: 'testTenant' };
      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mockToken');

      await loginUser(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('token', 'mockToken', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'u1' }));
    });
  });

  describe('logoutUser', () => {
    it('should log out user and clear cookie', async () => {
      await logoutUser(req, res, next);
      expect(res.cookie).toHaveBeenCalledWith('token', '', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { _id: 'u1', email: 'test@example.com', roles: ['USER'], tenant: 'testTenant' };
      User.findById.mockResolvedValue(mockUser);
      await getUserProfile(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [{ _id: 'u1' }];
      User.find.mockResolvedValue(mockUsers);
      await getUsers(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return a single user by ID', async () => {
      const mockUser = { _id: 'u1' };
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await getUserById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      req.body = { fullName: 'New User', email: 'new@example.com', password: 'password', tenant: 't1' };
      const mockUser = { _id: 'u2', ...req.body };
      User.findOne.mockResolvedValue(null);
      const userInstance = new User(req.body); // Create an instance to get its save method
      userInstance.save.mockResolvedValue(mockUser); // Mock the save method on the instance
      await createUser(req, res, next);
      expect(userInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const mockUser = { _id: 'u1', save: jest.fn().mockResolvedValue({ _id: 'u1', fullName: 'Updated Name' }) };
      req.body = { fullName: 'Updated Name' };
      User.findById.mockResolvedValue(mockUser);
      await updateUser(req, res, next);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ _id: 'u1', fullName: 'Updated Name' });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockUser = { _id: 'u1', deleteOne: jest.fn() };
      User.findById.mockResolvedValue(mockUser);
      await deleteUser(req, res, next);
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'User removed' });
    });
  });

  describe('getTenantUsers', () => {
    it('should return all users within a tenant\'s account', async () => {
      const mockUsers = [{ _id: 'u1' }];
      User.find.mockResolvedValue(mockUsers);
      await getTenantUsers(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('createTenantUser', () => {
    it('should create a new user within a tenant\'s account', async () => {
      req.body = { email: 'tenantuser@example.com', password: 'password' };
      const mockUser = { _id: 'tu1', ...req.body, save: jest.fn() };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      await createTenantUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getTenantUserById', () => {
    it('should return a single user by ID within a tenant\'s account', async () => {
      const mockUser = { _id: 'tu1' };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await getTenantUserById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateTenantUser', () => {
    it('should update a user within a tenant\'s account', async () => {
      const mockUser = { _id: 'tu1', save: jest.fn().mockResolvedValue({ _id: 'tu1', fullName: 'Updated Tenant User' }) };
      req.body = { fullName: 'Updated Tenant User' };
      User.findOne.mockResolvedValue(mockUser);
      await updateTenantUser(req, res, next);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ _id: 'tu1', fullName: 'Updated Tenant User' });
    });
  });

  describe('deleteTenantUser', () => {
    it('should delete a user within a tenant\'s account', async () => {
      const mockUser = { _id: 'tu1', deleteOne: jest.fn() };
      User.findOne.mockResolvedValue(mockUser);
      await deleteTenantUser(req, res, next);
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'User removed' });
    });
  });
});
