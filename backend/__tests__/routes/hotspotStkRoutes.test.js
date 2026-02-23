
const request = require('supertest');
const express = require('express');
const hotspotStkRoutes = require('../../routes/hotspotStkRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const hotspotStkController = require('../../controllers/hotspotStkController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/hotspotStkController', () => ({
  initiateStkPush: jest.fn((req, res) => res.status(200).json({ message: 'STK push initiated' })),
  handleHotspotCallback: jest.fn((req, res) => res.status(200).json({ message: 'Hotspot callback handled' })),
  getHotspotTransactions: jest.fn((req, res) => res.status(200).json({ message: 'Get hotspot transactions' })),
}));

const app = express();
app.use(express.json());
app.use('/api/hotspot-stk', hotspotStkRoutes);

describe('Hotspot STK Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/hotspot-stk should get hotspot transactions', async () => {
    const res = await request(app).get('/api/hotspot-stk');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get hotspot transactions' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(hotspotStkController.getHotspotTransactions).toHaveBeenCalled();
  });

  it('POST /api/hotspot-stk/stk-push should initiate an STK push', async () => {
    const res = await request(app).post('/api/hotspot-stk/stk-push').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'STK push initiated' });
    expect(protect).toHaveBeenCalled();
    expect(hotspotStkController.initiateStkPush).toHaveBeenCalled();
  });

  it('POST /api/hotspot-stk/callback should handle hotspot callback', async () => {
    const res = await request(app).post('/api/hotspot-stk/callback').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Hotspot callback handled' });
    expect(hotspotStkController.handleHotspotCallback).toHaveBeenCalled();
  });
});
