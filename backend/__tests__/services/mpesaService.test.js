const axios = require('axios');
const mpesaService = require('../../services/mpesaService');
const ApplicationSettings = require('../../models/ApplicationSettings');
const StkRequest = require('../../models/StkRequest');
const Transaction = require('../../models/Transaction');
const PaymentService = require('../../services/paymentService');

jest.mock('axios');
jest.mock('../../models/ApplicationSettings');
jest.mock('../../models/StkRequest');
jest.mock('../../models/Transaction');
jest.mock('../../services/paymentService', () => ({
    handleSuccessfulPayment: jest.fn(),
}));

describe('mpesaService', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateStkPushService', () => {
    it('should successfully initiate an STK push', async () => {
      ApplicationSettings.findOne.mockResolvedValue({
        mpesaPaybill: {
          consumerKey: 'key',
          consumerSecret: 'secret',
          paybillNumber: '123456',
          passkey: 'passkey',
          environment: 'sandbox',
        },
      });
      axios.get.mockResolvedValue({ data: { access_token: 'test_token' } });
      const mockPost = jest.fn().mockResolvedValue({ data: { CheckoutRequestID: 'test_checkout_id' } });
      axios.create.mockReturnValue({ post: mockPost });

      await mpesaService.initiateStkPushService('tenant-id', 10, '254700000000', 'test-ref');

      expect(axios.get).toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalled();
      expect(StkRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        checkoutRequestId: 'test_checkout_id',
      }));
    });
  });

  describe('processStkCallback', () => {
    it('should process a successful callback', async () => {
      const callbackData = {
        CheckoutRequestID: 'test_checkout_id',
        ResultCode: 0,
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 10 },
            { Name: 'MpesaReceiptNumber', Value: 'test_receipt' },
            { Name: 'PhoneNumber', Value: '254700000000' },
          ],
        },
      };
      StkRequest.findOne.mockResolvedValue({
        _id: 'stk-id',
        tenant: 'tenant-id',
        accountReference: 'test-ref',
        type: 'SUBSCRIPTION',
      });
      Transaction.findOne.mockResolvedValue(null);

      await mpesaService.processStkCallback(callbackData);

      expect(PaymentService.handleSuccessfulPayment).toHaveBeenCalled();
      expect(StkRequest.deleteOne).toHaveBeenCalledWith({ _id: 'stk-id' });
    });
  });

  describe('processC2bCallback', () => {
    it('should process a successful C2B callback', async () => {
      const callbackData = {
        TransID: 'test_trans_id',
        TransAmount: '10',
        BillRefNumber: 'test-ref',
        MSISDN: '254700000000',
        FirstName: 'John',
        LastName: 'Doe',
        BusinessShortCode: '123456',
      };
      ApplicationSettings.findOne.mockResolvedValue({ tenant: 'tenant-id' });
      Transaction.findOne.mockResolvedValue(null);

      await mpesaService.processC2bCallback(callbackData);

      expect(PaymentService.handleSuccessfulPayment).toHaveBeenCalled();
    });
  });

  describe('registerCallbackURL', () => {
    it('should successfully register the callback URL', async () => {
      ApplicationSettings.findOne.mockResolvedValue({
        mpesaPaybill: {
          consumerKey: 'key',
          consumerSecret: 'secret',
          paybillNumber: '123456',
          environment: 'sandbox',
        },
      });
      axios.get.mockResolvedValue({ data: { access_token: 'test_token' } });
      const mockPost = jest.fn().mockResolvedValue({ data: { ResponseDescription: 'Success' } });
      axios.create.mockReturnValue({ post: mockPost });

      const result = await mpesaService.registerCallbackURL('tenant-id');

      expect(mockPost).toHaveBeenCalled();
      expect(result).toEqual({ ResponseDescription: 'Success' });
    });
  });
});
