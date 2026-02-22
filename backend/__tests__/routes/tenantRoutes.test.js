
const request = require('supertest');
const express = require('express');
const tenantRoutes = require('../../routes/tenantRoutes');
const { protect, isSuperAdmin } = require('../../middlewares/protect');
const tenantController = require('../../controllers/tenantController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
    next();
  }),
  isSuperAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/tenantController', () => ({
  createTenant: jest.fn((req, res) => res.status(201).json({ message: 'Tenant created' })),
  getTenants: jest.fn((req, res) => res.status(200).json({ message: 'Get all tenants' })),
  getTenantById: jest.fn((req, res) => res.status(200).json({ message: `Get tenant ${req.params.id}` })),
  updateTenant: jest.fn((req, res) => res.status(200).json({ message: `Update tenant ${req.params.id}` })),
  deleteTenant: jest.fn((req, res) => res.status(200).json({ message: `Delete tenant ${req.params.id}` })),
  getTenantStats: jest.fn((req, res) => res.status(200).json({ message: 'Tenant stats' })),
  getMonthlyTenantGrowth: jest.fn((req, res) => res.status(200).json({ message: 'Monthly tenant growth' })),
}));

const app = express();
app.use(express.json());
app.use('/api/tenants', tenantRoutes);

describe('Tenant Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const tenantId = 'tenant123';

  it('POST /api/tenants should create a new tenant', async () => {
    const res = await request(app).post('/api/tenants').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Tenant created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.createTenant).toHaveBeenCalled();
  });

  it('GET /api/tenants should get all tenants', async () => {
    const res = await request(app).get('/api/tenants');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all tenants' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.getTenants).toHaveBeenCalled();
  });

  it('GET /api/tenants/stats should get tenant statistics', async () => {
    const res = await request(app).get('/api/tenants/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Tenant stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.getTenantStats).toHaveBeenCalled();
  });

  it('GET /api/tenants/monthly-growth/:year should get monthly tenant growth', async () => {
    const res = await request(app).get('/api/tenants/monthly-growth/2023');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Monthly tenant growth' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.getMonthlyTenantGrowth).toHaveBeenCalled();
  });

  it('GET /api/tenants/:id should get a tenant by ID', async () => {
    const res = await request(app).get(`/api/tenants/${tenantId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get tenant ${tenantId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.getTenantById).toHaveBeenCalled();
  });

  it('PUT /api/tenants/:id should update a tenant by ID', async () => {
    const res = await request(app).put(`/api/tenants/${tenantId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update tenant ${tenantId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.updateTenant).toHaveBeenCalled();
  });

  it('DELETE /api/tenants/:id should delete a tenant by ID', async () => {
    const res = await request(app).delete(`/api/tenants/${tenantId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete tenant ${tenantId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(tenantController.deleteTenant).toHaveBeenCalled();
  });
});
