
const request = require('supertest');
const express = require('express');
const hotspotSessionRoutes = require('../../routes/hotspotSessionRoutes');
const hotspotSessionController = require('../../controllers/hotspotSessionController');

// Mock controller functions
jest.mock('../../controllers/hotspotSessionController', () => ({
  getSessionStatus: jest.fn((req, res) => res.status(200).json({ message: `Session status for ${req.params.macAddress}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/hotspot-sessions', hotspotSessionRoutes);

describe('Hotspot Session Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/hotspot-sessions/session/:macAddress should get session status', async () => {
    const macAddress = 'AA:BB:CC:DD:EE:FF';
    const res = await request(app).get(`/api/hotspot-sessions/session/${macAddress}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Session status for ${macAddress}` });
    expect(hotspotSessionController.getSessionStatus).toHaveBeenCalled();
  });
});
