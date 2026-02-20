const {
  generateVouchers,
  getVouchers,
  deleteVoucherBatch,
  loginVoucher,
} = require('../../controllers/voucherController');
const Voucher = require('../../models/Voucher');
const MikrotikRouter = require('../../models/MikrotikRouter');
const HotspotSession = require('../../models/HotspotSession');
const HotspotPlan = require('../../models/HotspotPlan');
const mikrotikUtils = require('../../utils/mikrotikUtils');
const crypto = require('crypto');

jest.mock('../../models/Voucher', () => {
  const mockVoucherInstance = {
    save: jest.fn(),
    deleteOne: jest.fn(),
  };
  const mockVoucher = jest.fn(function(data) {
    Object.assign(this, data);
    this.save = mockVoucherInstance.save;
    this.deleteOne = mockVoucherInstance.deleteOne;
  });
  mockVoucher.find = jest.fn(() => [mockVoucherInstance]);
  mockVoucher.findOne = jest.fn(() => mockVoucherInstance);
  mockVoucher.deleteMany = jest.fn();
  return mockVoucher;
});
jest.mock('../../models/MikrotikRouter');
jest.mock('../../models/HotspotSession', () => ({
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../../models/HotspotPlan');
jest.mock('../../utils/mikrotikUtils');
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({ toString: () => 'mockBatchId' })),
}));

describe('Voucher Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { batchId: 'testBatchId' },
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

  describe('generateVouchers', () => {
    it('should generate a new batch of vouchers', async () => {
      req.body = {
        quantity: 1,
        withPassword: true,
        server: 'server1',
        profile: 'profile1',
        dataLimitValue: 100,
        dataLimitUnit: 'MB',
        timeLimitValue: 1,
        timeLimitUnit: 'hours',
        nameLength: 6,
        price: 10,
        mikrotikRouter: 'router1',
      };
      const mockRouter = { _id: 'router1' };
      MikrotikRouter.findById.mockResolvedValue(mockRouter);
      mikrotikUtils.addHotspotUser.mockResolvedValue(true);
      const mockVoucher = { _id: 'v1' };
      const voucherInstance = new Voucher(req.body); // Create an instance to get its save method
      voucherInstance.save.mockResolvedValue(mockVoucher); // Mock the save method on the instance

      await generateVouchers(req, res, next);

      expect(MikrotikRouter.findById).toHaveBeenCalledWith('router1');
      expect(mikrotikUtils.addHotspotUser).toHaveBeenCalled();
      expect(voucherInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('getVouchers', () => {
    it('should return all generated vouchers', async () => {
      const mockVouchers = [{ _id: 'v1' }];
      Voucher.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockVouchers) });
      await getVouchers(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockVouchers);
    });
  });

  describe('deleteVoucherBatch', () => {
    it('should delete a batch of vouchers', async () => {
      const mockVouchers = [{ _id: 'v1', mikrotikRouter: 'router1', username: 'user1' }];
      Voucher.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockVouchers) });
      mikrotikUtils.removeHotspotUser.mockResolvedValue(true);
      Voucher.deleteMany.mockResolvedValue({ deletedCount: 1 });

      await deleteVoucherBatch(req, res, next);

      expect(Voucher.find).toHaveBeenCalledWith({ batch: 'testBatchId', tenant: 'testTenant' });
      expect(mikrotikUtils.removeHotspotUser).toHaveBeenCalled();
      expect(Voucher.deleteMany).toHaveBeenCalledWith({ batch: 'testBatchId', tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Batch testBatchId removed' });
    });
  });

  describe('loginVoucher', () => {
    it('should log in with a voucher code', async () => {
      req.body = { voucherCode: 'user1', macAddress: 'mac1' };
      const mockVoucher = { 
        _id: 'v1', 
        status: 'active', 
        expiryDate: new Date(Date.now() + 100000), 
        mikrotikRouter: 'router1', 
        profile: 'profile1',
        save: jest.fn(),
      };
      const mockRouter = { _id: 'router1' };
      const mockPlan = { _id: 'plan1', timeLimitValue: 1, timeLimitUnit: 'hours', server: 'server1' };

      Voucher.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockVoucher) });
      MikrotikRouter.findById.mockResolvedValue(mockRouter);
      HotspotPlan.findOne.mockResolvedValue(mockPlan);
      mikrotikUtils.addHotspotIpBinding.mockResolvedValue(true);
      HotspotSession.findOneAndUpdate.mockResolvedValue({});

      await loginVoucher(req, res, next);

      expect(Voucher.findOne).toHaveBeenCalledWith({ username: 'user1' });
      expect(mikrotikUtils.addHotspotIpBinding).toHaveBeenCalled();
      expect(HotspotSession.findOneAndUpdate).toHaveBeenCalled();
      expect(mockVoucher.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Voucher login successful' });
    });
  });
});
