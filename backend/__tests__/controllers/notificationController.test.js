const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../../controllers/notificationController');
const Notification = require('../../models/Notification');

jest.mock('../../models/Notification');

describe('Notification Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testNotificationId' },
      user: { _id: 'testUserId', tenant: 'testTenant' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return all notifications for a user', async () => {
      const notifications = [{ _id: 'notif1' }, { _id: 'notif2' }];
      const mockFindResult = {
        sort: jest.fn().mockResolvedValue(notifications),
      };
      Notification.find.mockReturnValue(mockFindResult);

      await getNotifications(req, res);

      expect(Notification.find).toHaveBeenCalledWith({ user: 'testUserId', tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(notifications);
    });

    it('should return 500 if an error occurs', async () => {
      Notification.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = {
        _id: 'testNotificationId',
        user: 'testUserId',
        tenant: 'testTenant',
        status: 'unread',
        save: jest.fn().mockResolvedValue({ status: 'read' }),
      };
      Notification.findOne.mockResolvedValue(mockNotification);

      await markAsRead(req, res);

      expect(Notification.findOne).toHaveBeenCalledWith({ _id: 'testNotificationId', user: 'testUserId', tenant: 'testTenant' });
      expect(mockNotification.status).toBe('read');
      expect(mockNotification.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should return 404 if notification not found', async () => {
      Notification.findOne.mockResolvedValue(null);

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
    });

    it('should return 500 if an error occurs', async () => {
      Notification.findOne.mockRejectedValue(new Error('DB error'));

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      Notification.updateMany.mockResolvedValue({});

      await markAllAsRead(req, res);

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { user: 'testUserId', tenant: 'testTenant', status: 'unread' },
        { status: 'read' }
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
    });

    it('should return 500 if an error occurs', async () => {
      Notification.updateMany.mockRejectedValue(new Error('DB error'));

      await markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const mockNotification = { _id: 'testNotificationId' };
      Notification.findOneAndDelete.mockResolvedValue(mockNotification);

      await deleteNotification(req, res);

      expect(Notification.findOneAndDelete).toHaveBeenCalledWith({ _id: 'testNotificationId', user: 'testUserId', tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification removed' });
    });

    it('should return 404 if notification not found', async () => {
      Notification.findOneAndDelete.mockResolvedValue(null);

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
    });

    it('should return 500 if an error occurs', async () => {
      Notification.findOneAndDelete.mockRejectedValue(new Error('DB error'));

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
    });
  });
});