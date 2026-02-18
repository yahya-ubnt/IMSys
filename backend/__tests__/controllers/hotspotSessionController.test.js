const { getSessionStatus } = require('../../controllers/hotspotSessionController');
const HotspotSession = require('../../models/HotspotSession');

jest.mock('../../models/HotspotSession');

describe('HotspotSession Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { macAddress: 'AA:BB:CC:DD:EE:FF' },
      user: { tenant: 'testTenant' },
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

  describe('getSessionStatus', () => {
    it('should return session details if active', async () => {
      const mockSession = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        tenant: 'testTenant',
        endTime: new Date(Date.now() + 3600000), // 1 hour from now
      };
      HotspotSession.findOne.mockResolvedValue(mockSession);

      await getSessionStatus(req, res);

      expect(HotspotSession.findOne).toHaveBeenCalledWith({ macAddress: 'AA:BB:CC:DD:EE:FF', tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(mockSession);
    });

    it('should return 404 and delete session if expired', async () => {
      const mockSession = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        tenant: 'testTenant',
        endTime: new Date(Date.now() - 3600000), // 1 hour ago
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      HotspotSession.findOne.mockResolvedValue(mockSession);

      await getSessionStatus(req, res);

      expect(mockSession.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session expired' });
    });

    it('should return 404 if session not found', async () => {
      HotspotSession.findOne.mockResolvedValue(null);

      await getSessionStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session not found' });
    });
  });
});