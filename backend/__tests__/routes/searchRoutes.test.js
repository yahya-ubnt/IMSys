
const request = require('supertest');
const express = require('express');
const searchRoutes = require('../../routes/searchRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const searchController = require('../../controllers/searchController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/searchController', () => ({
  searchEntities: jest.fn((req, res) => res.status(200).json({ message: 'Search results' })),
}));

const app = express();
app.use(express.json());
app.use('/api/search', searchRoutes);

describe('Search Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/search should search for entities', async () => {
    const res = await request(app).get('/api/search?q=test&type=users');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Search results' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(searchController.searchEntities).toHaveBeenCalled();
  });
});
