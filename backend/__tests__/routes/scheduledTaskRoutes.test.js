
const request = require('supertest');
const express = require('express');
const scheduledTaskRoutes = require('../../routes/scheduledTaskRoutes');
const { protect, isSuperAdmin, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const scheduledTaskController = require('../../controllers/scheduledTaskController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdmin: jest.fn((req, res, next) => {
    if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as a Super Admin' });
    }
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/scheduledTaskController', () => ({
  getScheduledTasks: jest.fn((req, res) => res.status(200).json({ message: 'Get all scheduled tasks' })),
  createScheduledTask: jest.fn((req, res) => res.status(201).json({ message: 'Scheduled task created' })),
  updateScheduledTask: jest.fn((req, res) => res.status(200).json({ message: `Scheduled task ${req.params.id} updated` })),
  deleteScheduledTask: jest.fn((req, res) => res.status(200).json({ message: `Scheduled task ${req.params.id} deleted` })),
  runScheduledTask: jest.fn((req, res) => res.status(200).json({ message: `Scheduled task ${req.params.id} run` })),
}));

const app = express();
app.use(express.json());
app.use('/api/scheduled-tasks', scheduledTaskRoutes);

describe('Scheduled Task Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const taskId = 'task123';

  it('GET /api/scheduled-tasks should get all scheduled tasks', async () => {
    const res = await request(app).get('/api/scheduled-tasks');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all scheduled tasks' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.getScheduledTasks).toHaveBeenCalled();
  });

  it('POST /api/scheduled-tasks should create a new scheduled task (SuperAdmin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'user123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).post('/api/scheduled-tasks').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Scheduled task created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.createScheduledTask).toHaveBeenCalled();
  });

  it('POST /api/scheduled-tasks should return 403 if not SuperAdmin', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
        next();
    });
    const res = await request(app).post('/api/scheduled-tasks').send({});
    expect(res.statusCode).toEqual(403);
    expect(res.body).toEqual({ message: 'Not authorized as a Super Admin' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.createScheduledTask).not.toHaveBeenCalled();
  });

  it('PUT /api/scheduled-tasks/:id should update a scheduled task', async () => {
    const res = await request(app).put(`/api/scheduled-tasks/${taskId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Scheduled task ${taskId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.updateScheduledTask).toHaveBeenCalled();
  });

  it('DELETE /api/scheduled-tasks/:id should delete a scheduled task (SuperAdmin only)', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'user123', tenant: 'tenant123', roles: ['SUPER_ADMIN'] };
        next();
    });
    const res = await request(app).delete(`/api/scheduled-tasks/${taskId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Scheduled task ${taskId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.deleteScheduledTask).toHaveBeenCalled();
  });

  it('DELETE /api/scheduled-tasks/:id should return 403 if not SuperAdmin', async () => {
    protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
        next();
    });
    const res = await request(app).delete(`/api/scheduled-tasks/${taskId}`);
    expect(res.statusCode).toEqual(403);
    expect(res.body).toEqual({ message: 'Not authorized as a Super Admin' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.deleteScheduledTask).not.toHaveBeenCalled();
  });

  it('POST /api/scheduled-tasks/:id/run should run a scheduled task', async () => {
    const res = await request(app).post(`/api/scheduled-tasks/${taskId}/run`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Scheduled task ${taskId} run` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(scheduledTaskController.runScheduledTask).toHaveBeenCalled();
  });
});
