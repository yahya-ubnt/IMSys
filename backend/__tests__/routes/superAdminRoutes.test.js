
const request = require('supertest');
const express = require('express');
const superAdminRoutes = require('../../routes/superAdminRoutes');
const { protect, isSuperAdmin } = require('../../middlewares/protect');
const superAdminController = require('../../controllers/superAdminController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
    next();
  }),
  isSuperAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/superAdminController', () => ({
  getDashboardStats: jest.fn((req, res) => res.status(200).json({ message: 'Dashboard stats' })),
  getSuperAdminDashboardStats: jest.fn((req, res) => res.status(200).json({ message: 'Super Admin dashboard stats' })),
  getRoutersPerTenant: jest.fn((req, res) => res.status(200).json({ message: 'Routers per tenant' })),
  getUsersByPackage: jest.fn((req, res) => res.status(200).json({ message: 'Users by package' })),
}));

const app = express();
app.use(express.json());
app.use('/api/super-admin', superAdminRoutes);

describe('Super Admin Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/super-admin/dashboard-stats should get dashboard stats', async () => {
    const res = await request(app).get('/api/super-admin/dashboard-stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Dashboard stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(superAdminController.getDashboardStats).toHaveBeenCalled();
  });

  it('GET /api/super-admin/dashboard/stats should get super admin dashboard stats', async () => {
    const res = await request(app).get('/api/super-admin/dashboard/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Super Admin dashboard stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(superAdminController.getSuperAdminDashboardStats).toHaveBeenCalled();
  });

  it('GET /api/super-admin/dashboard/routers-per-tenant should get routers per tenant', async () => {
    const res = await request(app).get('/api/super-admin/dashboard/routers-per-tenant');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Routers per tenant' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(superAdminController.getRoutersPerTenant).toHaveBeenCalled();
  });

  it('GET /api/super-admin/dashboard/users-by-package should get users by package', async () => {
    const res = await request(app).get('/api/super-admin/dashboard/users-by-package');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Users by package' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(superAdminController.getUsersByPackage).toHaveBeenCalled();
  });
});
