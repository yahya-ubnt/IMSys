const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  handleNetworkEvent,
} = require('../../controllers/webhookController');

// Mock diagnosticQueue
jest.mock('../../queues/diagnosticQueue', () => ({
    add: jest.fn().mockResolvedValue(true)
}));
const diagnosticQueue = require('../../queues/diagnosticQueue');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Webhook Controller (Integration)', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.WEBHOOK_API_KEY = 'secret123';
    req = {
      query: { apiKey: 'secret123', deviceId: 'd1', status: 'DOWN' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('handleNetworkEvent', () => {
    it('should queue diagnostic job for DOWN event', async () => {
      await handleNetworkEvent(req, res, next);

      expect(diagnosticQueue.add).toHaveBeenCalledWith('verifyDeviceStatus', { deviceId: 'd1' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 for invalid api key', async () => {
        req.query.apiKey = 'wrong';
        await handleNetworkEvent(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
