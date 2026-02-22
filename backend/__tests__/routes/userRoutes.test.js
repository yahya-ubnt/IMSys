
const request = require('supertest');
const express = require('express');
const { publicRouter, privateRouter } = require('../../routes/userRoutes');
const { protect, isSuperAdmin, isAdmin } = require('../../middlewares/protect');
const userController = require('../../controllers/userController');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdmin: jest.fn((req, res, next) => {
    if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as a Super Admin' });
    }
  }),
  isAdmin: jest.fn((req, res, next) => {
    if (req.user && req.user.roles.includes('ADMIN')) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as an Admin' });
    }
  }),
}));

// Mock controller functions
jest.mock('../../controllers/userController', () => ({
  loginUser: jest.fn((req, res) => res.status(200).json({ message: 'User logged in' })),
  logoutUser: jest.fn((req, res) => res.status(200).json({ message: 'User logged out' })),
  getUserProfile: jest.fn((req, res) => res.status(200).json({ message: 'User profile' })),
  getUsers: jest.fn((req, res) => res.status(200).json({ message: 'Get all users' })),
  getUserById: jest.fn((req, res) => res.status(200).json({ message: `Get user ${req.params.id}` })),
  createUser: jest.fn((req, res) => res.status(201).json({ message: 'User created' })),
  updateUser: jest.fn((req, res) => res.status(200).json({ message: `Update user ${req.params.id}` })),
  deleteUser: jest.fn((req, res) => res.status(200).json({ message: `Delete user ${req.params.id}` })),
  getTenantUsers: jest.fn((req, res) => res.status(200).json({ message: 'Get tenant users' })),
  createTenantUser: jest.fn((req, res) => res.status(201).json({ message: 'Tenant user created' })),
  getTenantUserById: jest.fn((req, res) => res.status(200).json({ message: `Get tenant user ${req.params.id}` })),
  updateTenantUser: jest.fn((req, res) => res.status(200).json({ message: `Update tenant user ${req.params.id}` })),
  deleteTenantUser: jest.fn((req, res) => res.status(200).json({ message: `Delete tenant user ${req.params.id}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainableMethod = jest.fn().mockReturnThis();
    const mockChain = {};
    Object.assign(mockChain, {
      isEmail: mockChainableMethod,
      not: jest.fn(() => mockChain),
      isEmpty: mockChainableMethod,
      isLength: jest.fn(() => mockChain),
      optional: mockChainableMethod,
      isString: mockChainableMethod,
      isArray: mockChainableMethod,
      matches: mockChainableMethod,
    });
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChain);
  
    return {
      body: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

// Mock express-rate-limit
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));

const app = express();
app.use(express.json());
app.use('/api/users', publicRouter);
app.use('/api/users', privateRouter); // Mount private routes after public ones

describe('User Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const userId = 'user123';

  // Public Routes
  it('POST /api/users/login should log in a user', async () => {
    const res = await request(app).post('/api/users/login').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'User logged in' });
    expect(userController.loginUser).toHaveBeenCalled();
  });

  it('POST /api/users/logout should log out a user', async () => {
    const res = await request(app).post('/api/users/logout').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'User logged out' });
    expect(userController.logoutUser).toHaveBeenCalled();
  });

  // Private Routes (protected by default in mock)
  it('GET /api/users/profile should get user profile', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'User profile' });
    expect(protect).toHaveBeenCalled();
    expect(userController.getUserProfile).toHaveBeenCalled();
  });

  // Admin-specific routes
  it('GET /api/users/my-users should get tenant users (admin only)', async () => {
    const res = await request(app).get('/api/users/my-users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get tenant users' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(userController.getTenantUsers).toHaveBeenCalled();
  });

  it('POST /api/users/my-users should create a tenant user (admin only)', async () => {
    const res = await request(app).post('/api/users/my-users').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Tenant user created' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(userController.createTenantUser).toHaveBeenCalled();
  });

  it('GET /api/users/my-users/:id should get a tenant user by ID (admin only)', async () => {
    const res = await request(app).get(`/api/users/my-users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get tenant user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(userController.getTenantUserById).toHaveBeenCalled();
  });

  it('PUT /api/users/my-users/:id should update a tenant user by ID (admin only)', async () => {
    const res = await request(app).put(`/api/users/my-users/${userId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update tenant user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(userController.updateTenantUser).toHaveBeenCalled();
  });

  it('DELETE /api/users/my-users/:id should delete a tenant user by ID (admin only)', async () => {
    const res = await request(app).delete(`/api/users/my-users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete tenant user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(userController.deleteTenantUser).toHaveBeenCalled();
  });

  // Super Admin routes
  it('GET /api/users should get all users (super admin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'superadmin123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all users' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(userController.getUsers).toHaveBeenCalled();
  });

  it('POST /api/users should create a user (super admin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'superadmin123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).post('/api/users').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'User created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(userController.createUser).toHaveBeenCalled();
  });

  it('GET /api/users/:id should get a user by ID (super admin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'superadmin123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(userController.getUserById).toHaveBeenCalled();
  });

  it('PUT /api/users/:id should update a user by ID (super admin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'superadmin123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).put(`/api/users/${userId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(userController.updateUser).toHaveBeenCalled();
  });

  it('DELETE /api/users/:id should delete a user by ID (super admin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'superadmin123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).delete(`/api/users/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(userController.deleteUser).toHaveBeenCalled();
  });
});
