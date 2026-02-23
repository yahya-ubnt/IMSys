
const request = require('supertest');
const express = require('express');
const settingsRoutes = require('../../routes/settingsRoutes');
const { protect, isSuperAdminOrAdmin, isAdmin } = require('../../middlewares/protect');
const settingsController = require('../../controllers/settingsController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/settingsController', () => ({
    getGeneralSettings: jest.fn((req, res) => res.status(200).json({ message: 'Get general settings' })),
    updateGeneralSettings: jest.fn((req, res) => res.status(200).json({ message: 'Update general settings' })),
    getMpesaSettings: jest.fn((req, res) => res.status(200).json({ message: 'Get mpesa settings' })),
    updateMpesaSettings: jest.fn((req, res) => res.status(200).json({ message: 'Update mpesa settings' })),
    activateMpesa: jest.fn((req, res) => res.status(200).json({ message: 'Activate mpesa' })),
}));

const app = express();
app.use(express.json());
app.use('/api/settings', settingsRoutes);

describe('Settings Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/settings/general should get general settings', async () => {
    const res = await request(app).get('/api/settings/general');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get general settings' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(settingsController.getGeneralSettings).toHaveBeenCalled();
  });

  it('PUT /api/settings/general should update general settings', async () => {
    const res = await request(app).put('/api/settings/general').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Update general settings' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(settingsController.updateGeneralSettings).toHaveBeenCalled();
  });

  it('GET /api/settings/mpesa should get mpesa settings', async () => {
    const res = await request(app).get('/api/settings/mpesa');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get mpesa settings' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(settingsController.getMpesaSettings).toHaveBeenCalled();
  });

  it('PUT /api/settings/mpesa should update mpesa settings', async () => {
    const res = await request(app).put('/api/settings/mpesa').send({
        type: 'paybill',
        data: {
            consumerKey: 'key',
            consumerSecret: 'secret',
            passkey: 'passkey',
            paybillNumber: '123456'
        }
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Update mpesa settings' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(settingsController.updateMpesaSettings).toHaveBeenCalled();
  });

  it('POST /api/settings/mpesa/activate should activate mpesa', async () => {
    const res = await request(app).post('/api/settings/mpesa/activate').send({
        type: 'paybill'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Activate mpesa' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(settingsController.activateMpesa).toHaveBeenCalled();
  });
});
