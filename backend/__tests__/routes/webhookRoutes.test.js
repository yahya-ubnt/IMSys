
const request = require('supertest');
const express = require('express');
const webhookRoutes = require('../../routes/webhookRoutes');
const webhookController = require('../../controllers/webhookController');

// Mock controller functions
jest.mock('../../controllers/webhookController', () => ({
  handleNetworkEvent: jest.fn((req, res) => res.status(200).json({ message: 'Network event handled' })),
}));

const app = express();
app.use('/api/webhooks', webhookRoutes);

describe('Webhook Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/webhooks/network-event should handle network events', async () => {
    const res = await request(app).post('/api/webhooks/network-event').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Network event handled' });
    expect(webhookController.handleNetworkEvent).toHaveBeenCalled();
  });
});
