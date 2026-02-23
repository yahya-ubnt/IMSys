const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getRouterStatus,
  getRouterInterfaces,
  getActivePppoeSessions,
} = require('../../controllers/mikrotikDashboardController');
const Tenant = require('../../models/Tenant');

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

describe('Mikrotik Dashboard Controller (Integration)', () => {
  let req, res, next, tenant, mockClient;

  beforeEach(async () => {
    await Tenant.deleteMany({});
    tenant = await Tenant.create({ name: 'Dash Tenant' });

    mockClient = {
        write: jest.fn()
    };

    req = {
      params: { routerId: 'router123' },
      user: { tenant: tenant._id },
      mikrotikClient: mockClient
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getRouterStatus', () => {
    it('should return system resource info', async () => {
      mockClient.write.mockImplementation((path) => {
          if (path === '/system/resource/print') return Promise.resolve([{ uptime: '1d', cpu: '5%' }]);
          if (path === '/file/print') return Promise.resolve([]);
          if (path === '/ip/address/print') return Promise.resolve([]);
          return Promise.resolve([]);
      });

      await getRouterStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          uptime: '1d',
          'hdd-free': 'N/A'
      }));
    });
  });

  describe('getRouterInterfaces', () => {
      it('should return combined interface and traffic data', async () => {
          mockClient.write.mockImplementation((path) => {
              if (path === '/interface/print') return Promise.resolve([{ name: 'ether1' }]);
              if (path === '/interface/monitor-traffic') return Promise.resolve([{ name: 'ether1', 'rx-bits-per-second': '100' }]);
              return Promise.resolve([]);
          });

          await getRouterInterfaces(req, res, next);
          expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
              expect.objectContaining({ name: 'ether1', 'rx-byte': '100' })
          ]));
      });
  });
});
