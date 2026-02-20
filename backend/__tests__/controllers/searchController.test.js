const { searchEntities } = require('../../controllers/searchController');
const MikrotikUser = require('../../models/MikrotikUser');
const Device = require('../../models/Device');

jest.mock('../../models/MikrotikUser');
jest.mock('../../models/Device');

describe('Search Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { tenant: 'testTenant' },
      query: { q: 'test' },
    };
    res = {
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array if no query is provided', async () => {
    req.query.q = '';
    await searchEntities(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should search for users and devices and return combined results', async () => {
    const mockUsers = [
      { _id: 'u1', officialName: 'Test User', username: 'testuser', station: 'Station A' },
    ];
    const mockDevices = [
      { _id: 'd1', deviceName: 'Test Device', deviceType: 'Access' },
    ];

    MikrotikUser.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockUsers),
    });
    Device.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockDevices),
    });

    await searchEntities(req, res);

    expect(MikrotikUser.find).toHaveBeenCalled();
    expect(Device.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    const results = res.json.mock.calls[0][0];
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('type', 'User');
    expect(results[1]).toHaveProperty('type', 'Access');
  });
});
