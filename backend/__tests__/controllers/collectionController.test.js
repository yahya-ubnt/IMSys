const { getCollections, getCollectionStats, getMonthlyCollectionTotals, getDailyCollectionTotals } = require('../../controllers/collectionController');
const Transaction = require('../../models/Transaction');
const moment = require('moment-timezone');

jest.mock('../../models/Transaction');
jest.mock('moment-timezone');

describe('collectionController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'tenant-1' },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    
    // Mock moment to control time-based tests
    const mockMoment = {
        startOf: jest.fn().mockReturnThis(),
        toDate: jest.fn().mockReturnValue(new Date('2023-01-15')),
        date: jest.fn().mockReturnValue(31),
        endOf: jest.fn().mockReturnThis(),
      };
      moment.mockReturnValue(mockMoment);
      moment.tz = {
        setDefault: jest.fn(),
      };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCollections', () => {
    it('should get all collections for a tenant', async () => {
      const mockCollections = [{ amount: 100 }, { amount: 200 }];
      Transaction.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockCollections) });

      await getCollections(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockCollections);
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection stats', async () => {
      const mockStats = [{
        today: [{ total: 100 }],
        thisWeek: [{ total: 500 }],
        thisMonth: [{ total: 2000 }],
        thisYear: [{ total: 25000 }],
      }];
      Transaction.aggregate.mockResolvedValue(mockStats);

      await getCollectionStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        today: 100,
        thisWeek: 500,
        thisMonth: 2000,
        thisYear: 25000,
      });
    });
  });

  describe('getMonthlyCollectionTotals', () => {
    it('should return monthly totals for a given year', async () => {
      req.query.year = '2023';
      const mockTotals = [{ _id: { month: 1 }, total: 1500 }];
      Transaction.aggregate.mockResolvedValue(mockTotals);

      await getMonthlyCollectionTotals(req, res, next);

      const expectedData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: i === 0 ? 1500 : 0 }));
      expect(res.json).toHaveBeenCalledWith(expectedData);
    });
  });

  describe('getDailyCollectionTotals', () => {
    it('should return daily totals for a given month and year', async () => {
        req.query = { year: '2023', month: '1' };
        const mockTotals = [{ _id: { day: 15 }, total: 100 }];
        Transaction.aggregate.mockResolvedValue(mockTotals);
    
        await getDailyCollectionTotals(req, res, next);
    
        const expectedData = Array.from({ length: 31 }, (_, i) => ({ day: i + 1, total: i === 14 ? 100 : 0 }));
        expect(res.json).toHaveBeenCalledWith(expectedData);
      });
  });
});
