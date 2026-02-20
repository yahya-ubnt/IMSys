const { handleNetworkEvent } = require('../../controllers/webhookController');
const diagnosticQueue = require('../../queues/diagnosticQueue');

jest.mock('../../queues/diagnosticQueue', () => ({
  add: jest.fn(),
}));
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('Webhook Controller', () => {
  let req, res, next;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.WEBHOOK_API_KEY = 'test_api_key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.WEBHOOK_API_KEY;
  });

  it('should return 401 if API key is invalid', async () => {
    req.query = { deviceId: 'd1', status: 'DOWN', apiKey: 'wrong_key' };
    await handleNetworkEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(new Error('Unauthorized: Invalid API Key'));
  });

  it('should return 400 if deviceId or status is missing', async () => {
    req.query = { apiKey: 'test_api_key' };
    await handleNetworkEvent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(new Error('Bad Request: Missing deviceId or status'));
  });

  it('should queue a diagnostic job if status is DOWN', async () => {
    req.query = { deviceId: 'd1', status: 'DOWN', apiKey: 'test_api_key' };
    diagnosticQueue.add.mockResolvedValue({});
    await handleNetworkEvent(req, res, next);
    expect(diagnosticQueue.add).toHaveBeenCalledWith('verifyDeviceStatus', { deviceId: 'd1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Event received' });
  });

  it('should not queue a diagnostic job if status is not DOWN', async () => {
    req.query = { deviceId: 'd1', status: 'UP', apiKey: 'test_api_key' };
    await handleNetworkEvent(req, res, next);
    expect(diagnosticQueue.add).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Event received' });
  });
});
