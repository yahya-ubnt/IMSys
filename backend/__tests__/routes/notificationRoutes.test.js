
const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../../routes/notificationRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const notificationController = require('../../controllers/notificationController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/notificationController', () => ({
  getNotifications: jest.fn((req, res) => res.status(200).json({ message: 'Get all notifications' })),
  markAsRead: jest.fn((req, res) => res.status(200).json({ message: `Notification ${req.params.id} marked as read` })),
  deleteNotification: jest.fn((req, res) => res.status(200).json({ message: `Notification ${req.params.id} deleted` })),
  markAllAsRead: jest.fn((req, res) => res.status(200).json({ message: 'All notifications marked as read' })),
}));

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const notificationId = 'notif123';

  it('GET /api/notifications should get all notifications', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all notifications' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(notificationController.getNotifications).toHaveBeenCalled();
  });

  it('PUT /api/notifications/:id/read should mark a notification as read', async () => {
    const res = await request(app).put(`/api/notifications/${notificationId}/read`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Notification ${notificationId} marked as read` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(notificationController.markAsRead).toHaveBeenCalled();
  });

  it('DELETE /api/notifications/:id should delete a notification', async () => {
    const res = await request(app).delete(`/api/notifications/${notificationId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Notification ${notificationId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(notificationController.deleteNotification).toHaveBeenCalled();
  });

  it('PUT /api/notifications/read/all should mark all notifications as read', async () => {
    const res = await request(app).put('/api/notifications/read/all').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'All notifications marked as read' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(notificationController.markAllAsRead).toHaveBeenCalled();
  });
});
