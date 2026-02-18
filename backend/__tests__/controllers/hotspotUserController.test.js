const {
  createHotspotUser,
  getHotspotUsers,
  getHotspotUserById,
  updateHotspotUser,
  deleteHotspotUser,
} = require('../../controllers/hotspotUserController');
const HotspotUser = require('../../models/HotspotUser');
const MikrotikRouter = require('../../models/MikrotikRouter');
const { addHotspotUser, removeHotspotUser, getMikrotikApiClient } = require('../../utils/mikrotikUtils');

jest.mock('../../models/HotspotUser');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../utils/mikrotikUtils');

describe('HotspotUser Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testUserId' },
      user: { tenant: 'testTenant' },
      body: {},
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

  describe('createHotspotUser', () => {
    it('should create a hotspot user', async () => {
      const userData = {
        officialName: 'Test User',
        hotspotName: 'testuser',
        hotspotPassword: 'password',
        mikrotikRouter: 'router1',
      };
      req.body = userData;
      MikrotikRouter.findOne.mockResolvedValue({ _id: 'router1', tenant: 'testTenant' });
      addHotspotUser.mockResolvedValue(true);
      HotspotUser.prototype.save = jest.fn().mockResolvedValue({ ...userData, tenant: 'testTenant' });

      await createHotspotUser(req, res);

      expect(MikrotikRouter.findOne).toHaveBeenCalledWith({ _id: 'router1', tenant: 'testTenant' });
      expect(addHotspotUser).toHaveBeenCalled();
      expect(HotspotUser.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(userData));
    });

    it('should return 404 if Mikrotik router not found', async () => {
      req.body = { mikrotikRouter: 'router1' };
      MikrotikRouter.findOne.mockResolvedValue(null);

      await createHotspotUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Mikrotik router not found' });
    });

    it('should return 500 if failed to create hotspot user on Mikrotik', async () => {
      req.body = { mikrotikRouter: 'router1' };
      MikrotikRouter.findOne.mockResolvedValue({ _id: 'router1', tenant: 'testTenant' });
      addHotspotUser.mockResolvedValue(false);

      await createHotspotUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create hotspot user on Mikrotik router' });
    });

    it('should rollback Mikrotik user if saving to DB fails', async () => {
      const userData = {
        officialName: 'Test User',
        hotspotName: 'testuser',
        hotspotPassword: 'password',
        mikrotikRouter: 'router1',
      };
      req.body = userData;
      MikrotikRouter.findOne.mockResolvedValue({ _id: 'router1', tenant: 'testTenant' });
      addHotspotUser.mockResolvedValue(true);
      HotspotUser.prototype.save = jest.fn().mockRejectedValue(new Error('DB error'));

      await createHotspotUser(req, res);

      expect(removeHotspotUser).toHaveBeenCalledWith(expect.any(Object), 'testuser');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create hotspot user due to database error, Mikrotik user rolled back.' });
    });
  });

  describe('getHotspotUsers', () => {
    it('should return all hotspot users for a tenant', async () => {
      const users = [{ hotspotName: 'user1' }, { hotspotName: 'user2' }];
      HotspotUser.find.mockReturnThis();
      HotspotUser.populate.mockResolvedValue(users);

      await getHotspotUsers(req, res);

      expect(HotspotUser.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(users);
    });

    it('should return 500 if an error occurs', async () => {
      HotspotUser.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getHotspotUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('getHotspotUserById', () => {
    it('should return a single hotspot user', async () => {
      const user = { _id: 'testUserId', hotspotName: 'testuser', tenant: 'testTenant' };
      HotspotUser.findById.mockResolvedValue(user);

      await getHotspotUserById(req, res);

      expect(HotspotUser.findById).toHaveBeenCalledWith('testUserId');
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it('should return 404 if user not found', async () => {
      HotspotUser.findById.mockResolvedValue(null);

      await getHotspotUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 404 if user belongs to another tenant', async () => {
      const user = { _id: 'testUserId', hotspotName: 'testuser', tenant: 'otherTenant' };
      HotspotUser.findById.mockResolvedValue(user);

      await getHotspotUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('updateHotspotUser', () => {
    it('should update a hotspot user', async () => {
      const mockUser = {
        _id: 'testUserId',
        hotspotName: 'olduser',
        tenant: 'testTenant',
        mikrotikRouter: 'router1',
        save: jest.fn().mockResolvedValue({ _id: 'testUserId', hotspotName: 'newuser', tenant: 'testTenant', mikrotikRouter: 'router1' }),
      };
      HotspotUser.findById.mockResolvedValue(mockUser);
      MikrotikRouter.findById.mockResolvedValue({ _id: 'router1' });
      getMikrotikApiClient.mockResolvedValue({
        write: jest.fn()
          .mockResolvedValueOnce([{ '.id': 'mikrotikUserId' }]) // for print
          .mockResolvedValueOnce({}), // for set
        close: jest.fn(),
        connected: true,
      });
      req.body = { hotspotName: 'newuser', profile: 'newprofile' };

      await updateHotspotUser(req, res);

      expect(mockUser.hotspotName).toBe('newuser');
      expect(mockUser.save).toHaveBeenCalled();
      expect(getMikrotikApiClient).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ hotspotName: 'newuser' }));
    });

    it('should return 404 if user not found', async () => {
      HotspotUser.findById.mockResolvedValue(null);

      await updateHotspotUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('deleteHotspotUser', () => {
    it('should delete a hotspot user', async () => {
      const mockUser = {
        _id: 'testUserId',
        hotspotName: 'testuser',
        tenant: 'testTenant',
        mikrotikRouter: { _id: 'router1' },
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      HotspotUser.findById.mockResolvedValue(mockUser);
      removeHotspotUser.mockResolvedValue(true);

      await deleteHotspotUser(req, res);

      expect(removeHotspotUser).toHaveBeenCalledWith(expect.any(Object), 'testuser');
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'User removed' });
    });

    it('should return 404 if user not found', async () => {
      HotspotUser.findById.mockResolvedValue(null);

      await deleteHotspotUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });
});