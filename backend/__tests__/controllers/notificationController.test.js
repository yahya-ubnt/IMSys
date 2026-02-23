const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getNotifications,
  markAsRead,
} = require('../../controllers/notificationController');
const Notification = require('../../models/Notification');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');

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

describe('Notification Controller (Integration)', () => {
  let req, res, next, tenant, user;

  beforeEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Notif Tenant' });
    user = await User.create({
        fullName: 'N User',
        email: 'n@test.com',
        password: 'p',
        phone: '123',
        roles: ['ADMIN'],
        tenant: tenant._id
    });

    req = {
      params: {},
      user: { _id: user._id, tenant: tenant._id },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return notifications for user', async () => {
      await Notification.create({
        user: user._id,
        tenant: tenant._id,
        message: 'New Event',
        type: 'system'
      });

      await getNotifications(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ message: 'New Event' })
      ]));
    });
  });

  describe('markAsRead', () => {
      it('should mark notification as read', async () => {
          const n = await Notification.create({
              user: user._id,
              tenant: tenant._id,
              title: 'T',
              message: 'M',
              status: 'unread'
          });

          req.params.id = n._id;
          await markAsRead(req, res, next);
          const updated = await Notification.findById(n._id);
          expect(updated.status).toBe('read');
      });
  });
});
