
const request = require('supertest');
const express = require('express');
const publicPaymentRoutes = require('../../routes/publicPaymentRoutes');
const paymentController = require('../../controllers/paymentController');

// Mock controller functions
jest.mock('../../controllers/paymentController', () => ({
  handleDarajaCallback: jest.fn((req, res) => res.status(200).json({ message: 'Daraja callback handled' })),
}));

const app = express();
app.use(express.json());
app.use('/api/public-payments', publicPaymentRoutes);

describe('Public Payment Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/public-payments/daraja-callback should handle Daraja callback', async () => {
    const res = await request(app).post('/api/public-payments/daraja-callback').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Daraja callback handled' });
    expect(paymentController.handleDarajaCallback).toHaveBeenCalled();
  });
});
