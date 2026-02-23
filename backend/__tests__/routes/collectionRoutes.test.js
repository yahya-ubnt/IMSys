
const request = require('supertest');
const express = require('express');
const collectionRoutes = require('../../routes/collectionRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const collectionController = require('../../controllers/collectionController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/collectionController', () => ({
  getCollections: jest.fn((req, res) => res.status(200).json({ message: 'Get all collections' })),
  getCollectionStats: jest.fn((req, res) => res.status(200).json({ message: 'Get collection stats' })),
  getMonthlyCollectionTotals: jest.fn((req, res) => res.status(200).json({ message: 'Get monthly collection totals' })),
  getDailyCollectionTotals: jest.fn((req, res) => res.status(200).json({ message: 'Get daily collection totals' })),
}));

const app = express();
app.use(express.json());
app.use('/api/collections', collectionRoutes);

describe('Collection Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/collections/stats should get collection statistics', async () => {
    const res = await request(app).get('/api/collections/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get collection stats' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(collectionController.getCollectionStats).toHaveBeenCalled();
  });

  it('GET /api/collections/monthly-totals should get monthly collection totals', async () => {
    const res = await request(app).get('/api/collections/monthly-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get monthly collection totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(collectionController.getMonthlyCollectionTotals).toHaveBeenCalled();
  });

  it('GET /api/collections/daily-totals should get daily collection totals', async () => {
    const res = await request(app).get('/api/collections/daily-totals');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get daily collection totals' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(collectionController.getDailyCollectionTotals).toHaveBeenCalled();
  });

  it('GET /api/collections should get all collections', async () => {
    const res = await request(app).get('/api/collections');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all collections' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(collectionController.getCollections).toHaveBeenCalled();
  });
});
