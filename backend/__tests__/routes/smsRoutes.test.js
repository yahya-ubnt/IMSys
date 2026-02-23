
const request = require('supertest');
const express = require('express');
const smsRoutes = require('../../routes/smsRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const smsController = require('../../controllers/smsController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/smsController', () => ({
    getSmsTriggers: jest.fn((req, res) => res.status(200).json({ message: 'Get sms triggers' })),
    composeAndSendSms: jest.fn((req, res) => res.status(200).json({ message: 'Compose and send sms' })),
    getSentSmsLog: jest.fn((req, res) => res.status(200).json({ message: 'Get sent sms log' })),
    exportSmsLogs: jest.fn((req, res) => res.status(200).json({ message: 'Export sms logs' })),
    getSmsLogsForUserController: jest.fn((req, res) => res.status(200).json({ message: `Get sms logs for user ${req.params.userId}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/sms', smsRoutes);

describe('Sms Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/sms/triggers should get sms triggers', async () => {
    const res = await request(app).get('/api/sms/triggers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get sms triggers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.getSmsTriggers).toHaveBeenCalled();
  });

  it('POST /api/sms/compose should compose and send sms', async () => {
    const res = await request(app).post('/api/sms/compose').send({
        message: 'Test message',
        sendToType: 'users',
        userIds: ['60d5f3f3f3f3f3f3f3f3f3f3']
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Compose and send sms' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.composeAndSendSms).toHaveBeenCalled();
  });

  it('GET /api/sms/log should get sent sms log', async () => {
    const res = await request(app).get('/api/sms/log');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get sent sms log' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.getSentSmsLog).toHaveBeenCalled();
  });

  it('GET /api/sms/log/export should export sms logs', async () => {
    const res = await request(app).get('/api/sms/log/export');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Export sms logs' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.exportSmsLogs).toHaveBeenCalled();
  });

  it('GET /api/sms/logs/user/:userId should get sms logs for a user', async () => {
    const userId = 'user123';
    const res = await request(app).get(`/api/sms/logs/user/${userId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get sms logs for user ${userId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsController.getSmsLogsForUserController).toHaveBeenCalled();
  });
});
