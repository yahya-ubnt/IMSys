const {
  getHotspotTransactions,
  initiateStkPush,
  handleHotspotCallback,
} = require('../../controllers/hotspotStkController');
const HotspotTransaction = require('../../models/HotspotTransaction');
const HotspotSession = require('../../models/HotspotSession');
const HotspotPlan = require('../../models/HotspotPlan');
const MikrotikRouter = require('../../models/MikrotikRouter');
const mpesaService = require('../../services/mpesaService');
const mikrotikUtils = require('../../utils/mikrotikUtils');
const { validationResult } = require('express-validator');

jest.mock('../../models/HotspotTransaction');
jest.mock('../../models/HotspotSession', () => ({
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../../models/HotspotPlan');
jest.mock('../../models/MikrotikRouter');
jest.mock('../../services/mpesaService', () => ({
  initiateStkPushService: jest.fn(),
}));
jest.mock('../../utils/mikrotikUtils');
jest.mock('express-validator');
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('Hotspot STK Controller', () => {
  let req, res, next;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    req = {
      params: {},
      user: { tenant: 'testTenant' },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHotspotTransactions', () => {
    it('should return hotspot transactions', async () => {
      const mockTransactions = [{ _id: 't1', amount: 100 }];
      HotspotTransaction.countDocuments.mockResolvedValue(1);
      HotspotTransaction.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTransactions),
      });

      await getHotspotTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        transactions: mockTransactions,
        pages: 1,
      }));
    });
  });

  describe('initiateStkPush', () => {
    it('should initiate STK push successfully', async () => {
      const mockPlan = { _id: 'plan1', price: 100, tenant: 'testTenant' };
      req.body = { planId: 'plan1', phoneNumber: '254712345678', macAddress: '00:11:22:33:44:55' };
      HotspotPlan.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPlan),
      });
      HotspotTransaction.create.mockResolvedValue({ _id: 'ht1' });
      mpesaService.initiateStkPushService.mockResolvedValue({ success: true });

      await initiateStkPush(req, res);

      expect(HotspotPlan.findById).toHaveBeenCalledWith('plan1');
      expect(HotspotTransaction.create).toHaveBeenCalled();
      expect(mpesaService.initiateStkPushService).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 if plan not found', async () => {
        req.body = { planId: 'plan1', phoneNumber: '254712345678', macAddress: '00:11:22:33:44:55' };
        HotspotPlan.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
        });
  
        await initiateStkPush(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Plan not found' });
      });
  });

  describe('handleHotspotCallback', () => {
    it('should process callback successfully', async () => {
      req.body = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'cr1',
            ResultCode: 0,
            CallbackMetadata: {
              Item: [{ Name: 'MpesaReceiptNumber', Value: 'mrn1' }],
            },
          },
        },
      };
      const mockTransaction = { _id: 'ht1', planId: 'plan1', macAddress: '00:11:22:33:44:55', save: jest.fn() };
      const mockPlan = { _id: 'plan1', timeLimitUnit: 'hours', timeLimitValue: 1, server: 'hotspot1' };
      const mockRouter = { _id: 'r1' };

      HotspotTransaction.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockTransaction);
      HotspotPlan.findById.mockResolvedValue(mockPlan);
      MikrotikRouter.findById.mockResolvedValue(mockRouter);
      HotspotSession.findOneAndUpdate.mockResolvedValue({});
      mikrotikUtils.addHotspotIpBinding.mockResolvedValue(true);

      await handleHotspotCallback(req, res);

      expect(HotspotTransaction.findOne).toHaveBeenCalledWith({ checkoutRequestId: 'cr1' });
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(HotspotPlan.findById).toHaveBeenCalledWith(mockTransaction.planId);
      expect(MikrotikRouter.findById).toHaveBeenCalledWith(mockPlan.mikrotikRouter);
      expect(HotspotSession.findOneAndUpdate).toHaveBeenCalled();
      expect(mikrotikUtils.addHotspotIpBinding).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Callback processed successfully' });
    });
  });
});
