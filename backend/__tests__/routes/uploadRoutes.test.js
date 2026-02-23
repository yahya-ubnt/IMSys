
const request = require('supertest');
const express = require('express');
const uploadRoutes = require('../../routes/uploadRoutes');
const { protect, isAdmin } = require('../../middlewares/protect');
const uploadController = require('../../controllers/uploadController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/uploadController', () => ({
  uploadImage: jest.fn((req, res) => res.status(200).json({ message: 'Image uploaded' })),
}));

const app = express();
app.use(express.json());
app.use('/api/uploads', uploadRoutes);

describe('Upload Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/uploads should upload an image', async () => {
    const res = await request(app).post('/api/uploads').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Image uploaded' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(uploadController.uploadImage).toHaveBeenCalled();
  });
});
