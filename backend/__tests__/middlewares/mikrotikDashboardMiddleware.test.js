
const httpMocks = require('node-mocks-http');
const { connectToRouter } = require('../../middlewares/mikrotikDashboardMiddleware');
const MikrotikRouter = require('../../models/MikrotikRouter');
const { decrypt } = require('../../utils/crypto');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/crypto');
jest.mock('node-routeros');

describe('Mikrotik Dashboard Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();

    // Mock decrypt function
    decrypt.mockReturnValue('decryptedPassword');

    // Mock RouterOSAPI
    RouterOSAPI.mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
      connected: true,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to the router and attach client to req', async () => {
    const mockRouter = {
      _id: 'router123',
      tenant: 'tenant123',
      name: 'TestRouter',
      ipAddress: '192.168.1.1',
      apiUsername: 'admin',
      apiPassword: 'encryptedPassword',
      apiPort: 8728,
    };
    MikrotikRouter.findOne.mockResolvedValue(mockRouter);
    req.params.routerId = 'router123';
    req.user = { tenant: 'tenant123' };

    await connectToRouter(req, res, next);

    expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'router123', tenant: 'tenant123' });
    expect(decrypt).toHaveBeenCalledWith('encryptedPassword');
    expect(RouterOSAPI).toHaveBeenCalledWith({
      host: '192.168.1.1',
      user: 'admin',
      password: 'decryptedPassword',
      port: 8728,
      timeout: 5000,
    });
    expect(req.mikrotikClient.connect).toHaveBeenCalled();
    expect(req.mikrotikClient.connected).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should handle router not found', async () => {
    MikrotikRouter.findOne.mockResolvedValue(null);
    req.params.routerId = 'nonexistent';
    req.user = { tenant: 'tenant123' };

    await connectToRouter(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Could not decrypt router password. Please check settings.' }));
  });

  it('should handle decryption failure', async () => {
    const mockRouter = {
      _id: 'router123',
      tenant: 'tenant123',
      name: 'TestRouter',
      ipAddress: '192.168.1.1',
      apiUsername: 'admin',
      apiPassword: 'invalidEncryptedPassword',
      apiPort: 8728,
    };
    MikrotikRouter.findOne.mockResolvedValue(mockRouter);
    decrypt.mockImplementation(() => { throw new Error('Decryption failed'); });
    req.params.routerId = 'router123';
    req.user = { tenant: 'tenant123' };

    await connectToRouter(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Could not decrypt router password. Please check settings.' }));
  });

  it('should handle connection failure to Mikrotik', async () => {
    const mockRouter = {
      _id: 'router123',
      tenant: 'tenant123',
      name: 'TestRouter',
      ipAddress: '192.168.1.1',
      apiUsername: 'admin',
      apiPassword: 'encryptedPassword',
      apiPort: 8728,
    };
    MikrotikRouter.findOne.mockResolvedValue(mockRouter);
    RouterOSAPI.mockImplementation(() => ({
      connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
      close: jest.fn(),
      connected: false,
    }));
    req.params.routerId = 'router123';
    req.user = { tenant: 'tenant123' };

    await connectToRouter(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Could not connect to router: TestRouter' }));
  });

  it('should close the client connection after response finishes', async () => {
    const mockRouter = {
      _id: 'router123',
      tenant: 'tenant123',
      name: 'TestRouter',
      ipAddress: '192.168.1.1',
      apiUsername: 'admin',
      apiPassword: 'encryptedPassword',
      apiPort: 8728,
    };
    MikrotikRouter.findOne.mockResolvedValue(mockRouter);
    const mockClient = {
      connect: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
      connected: true,
    };
    RouterOSAPI.mockImplementation(() => mockClient);
    req.params.routerId = 'router123';
    req.user = { tenant: 'tenant123' };

    // Mock res.on to capture the finish handler
    let finishHandler;
    res.on = jest.fn((event, handler) => {
      if (event === 'finish') {
        finishHandler = handler;
      }
    });

    await connectToRouter(req, res, next);

    // Manually call the captured finish handler
    if (finishHandler) {
      finishHandler();
    }

    expect(mockClient.close).toHaveBeenCalled();
  });
});
