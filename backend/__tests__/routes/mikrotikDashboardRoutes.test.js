
const request = require('supertest');
const express = require('express');
const mikrotikDashboardRoutes = require('../../routes/mikrotikDashboardRoutes');
const { protect, isAdmin } = require('../../middlewares/protect');
const { connectToRouter } = require('../../middlewares/mikrotikDashboardMiddleware');
const mikrotikDashboardController = require('../../controllers/mikrotikDashboardController');
const { body, param } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next()),
}));

jest.mock('../../middlewares/mikrotikDashboardMiddleware', () => ({
    connectToRouter: jest.fn((req, res, next) => {
        req.mikrotikClient = {
            connect: jest.fn().mockResolvedValue(true),
            close: jest.fn(),
            connected: true,
            write: jest.fn().mockResolvedValue([]),
            // Mock other methods as needed for specific tests
        };
        next();
    }),
}));

// Mock controller functions
jest.mock('../../controllers/mikrotikDashboardController', () => ({
  getRouterStatus: jest.fn((req, res) => res.status(200).json({ message: 'Router status' })),
  getRouterInterfaces: jest.fn((req, res) => res.status(200).json({ message: 'Router interfaces' })),
  getInterfaceTraffic: jest.fn((req, res) => res.status(200).json({ message: `Traffic for ${req.params.interfaceName}` })),
  getActivePppoeSessions: jest.fn((req, res) => res.status(200).json({ message: 'Active PPPoE sessions' })),
  disconnectPppoeUser: jest.fn((req, res) => res.status(200).json({ message: 'PPPoE user disconnected' })),
  getPppoeSecrets: jest.fn((req, res) => res.status(200).json({ message: 'PPPoE secrets' })),
  addPppoeSecret: jest.fn((req, res) => res.status(201).json({ message: 'PPPoE secret added' })),
  updatePppoeSecret: jest.fn((req, res) => res.status(200).json({ message: `PPPoE secret ${req.params.secretId} updated` })),
  deletePppoeSecret: jest.fn((req, res) => res.status(200).json({ message: `PPPoE secret ${req.params.secretId} deleted` })),
  getQueues: jest.fn((req, res) => res.status(200).json({ message: 'Queues' })),
  addQueue: jest.fn((req, res) => res.status(201).json({ message: 'Queue added' })),
  updateQueue: jest.fn((req, res) => res.status(200).json({ message: `Queue ${req.params.queueId} updated` })),
  deleteQueue: jest.fn((req, res) => res.status(200).json({ message: `Queue ${req.params.queueId} deleted` })),
  getFirewallFilters: jest.fn((req, res) => res.status(200).json({ message: 'Firewall filters' })),
  getDhcpLeases: jest.fn((req, res) => res.status(200).json({ message: 'DHCP leases' })),
  getLogs: jest.fn((req, res) => res.status(200).json({ message: 'Logs' })),
  getPppoeUserCounts: jest.fn((req, res) => res.status(200).json({ message: 'PPPoE user counts' })),
  getStaticUserCounts: jest.fn((req, res) => res.status(200).json({ message: 'Static user counts' })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isString: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      isBoolean: jest.fn().mockReturnThis(),
    };
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChainable);
  
    return {
      body: jest.fn(() => mockMiddleware),
      param: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

const app = express();
app.use(express.json());
app.use('/api/mikrotik-dashboard/:routerId', mikrotikDashboardRoutes);

describe('Mikrotik Dashboard Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const routerId = 'router123';

  it('GET /api/mikrotik-dashboard/:routerId/status should get router status', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/status`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Router status' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getRouterStatus).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/interfaces should get router interfaces', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/interfaces`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Router interfaces' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getRouterInterfaces).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/pppoe/active should get active PPPoE sessions', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/pppoe/active`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Active PPPoE sessions' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getActivePppoeSessions).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-dashboard/:routerId/pppoe/active/disconnect should disconnect a PPPoE user', async () => {
    const res = await request(app).post(`/api/mikrotik-dashboard/${routerId}/pppoe/active/disconnect`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'PPPoE user disconnected' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.disconnectPppoeUser).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/pppoe/secrets should get PPPoE secrets', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/pppoe/secrets`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'PPPoE secrets' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getPppoeSecrets).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-dashboard/:routerId/pppoe/secrets should add a PPPoE secret', async () => {
    const res = await request(app).post(`/api/mikrotik-dashboard/${routerId}/pppoe/secrets`).send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'PPPoE secret added' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.addPppoeSecret).toHaveBeenCalled();
  });

  it('PUT /api/mikrotik-dashboard/:routerId/pppoe/secrets/:secretId should update a PPPoE secret', async () => {
    const secretId = 'secret123';
    const res = await request(app).put(`/api/mikrotik-dashboard/${routerId}/pppoe/secrets/${secretId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `PPPoE secret ${secretId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.updatePppoeSecret).toHaveBeenCalled();
  });

  it('DELETE /api/mikrotik-dashboard/:routerId/pppoe/secrets/:secretId should delete a PPPoE secret', async () => {
    const secretId = 'secret123';
    const res = await request(app).delete(`/api/mikrotik-dashboard/${routerId}/pppoe/secrets/${secretId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `PPPoE secret ${secretId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.deletePppoeSecret).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/queues should get queues', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/queues`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Queues' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getQueues).toHaveBeenCalled();
  });

  it('POST /api/mikrotik-dashboard/:routerId/queues should add a queue', async () => {
    const res = await request(app).post(`/api/mikrotik-dashboard/${routerId}/queues`).send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Queue added' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.addQueue).toHaveBeenCalled();
  });

  it('PUT /api/mikrotik-dashboard/:routerId/queues/:queueId should update a queue', async () => {
    const queueId = 'queue123';
    const res = await request(app).put(`/api/mikrotik-dashboard/${routerId}/queues/${queueId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Queue ${queueId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.updateQueue).toHaveBeenCalled();
  });

  it('DELETE /api/mikrotik-dashboard/:routerId/queues/:queueId should delete a queue', async () => {
    const queueId = 'queue123';
    const res = await request(app).delete(`/api/mikrotik-dashboard/${routerId}/queues/${queueId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Queue ${queueId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.deleteQueue).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/firewall/filter should get firewall filters', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/firewall/filter`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Firewall filters' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getFirewallFilters).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/dhcp-leases should get DHCP leases', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/dhcp-leases`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'DHCP leases' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getDhcpLeases).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/logs should get logs', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/logs`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Logs' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getLogs).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/pppoe/counts should get PPPoE user counts', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/pppoe/counts`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'PPPoE user counts' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getPppoeUserCounts).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/static/counts should get static user counts', async () => {
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/static/counts`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Static user counts' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getStaticUserCounts).toHaveBeenCalled();
  });

  it('GET /api/mikrotik-dashboard/:routerId/traffic/:interfaceName should get interface traffic', async () => {
    const interfaceName = 'ether1';
    const res = await request(app).get(`/api/mikrotik-dashboard/${routerId}/traffic/${interfaceName}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Traffic for ${interfaceName}` });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(connectToRouter).toHaveBeenCalled();
    expect(mikrotikDashboardController.getInterfaceTraffic).toHaveBeenCalled();
  });
});
