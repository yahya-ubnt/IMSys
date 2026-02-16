// Mock dependencies MUST be at the top
jest.mock('../../models/MikrotikUser');
jest.mock('../../models/WalletTransaction');
jest.mock('../../models/Invoice');
jest.mock('../../models/Transaction');
jest.mock('../../models/MpesaAlert');
jest.mock('../../queues/mikrotikSyncQueue', () => ({
    add: jest.fn(),
}));
jest.mock('../../services/smsService', () => ({
    sendAcknowledgementSms: jest.fn(),
}));
jest.mock('crypto', () => ({
    ...jest.requireActual('crypto'),
    randomUUID: jest.fn(() => 'mock-uuid'),
}));
jest.mock('moment', () => {
    const moment = jest.requireActual('moment');
    const mockDate = '2024-01-01T00:00:00.000Z';
    const momentWrapper = (...args) => args.length > 0 ? moment(...args) : moment(mockDate);
    Object.assign(momentWrapper, moment);
    return momentWrapper;
});

const mongoose = require('mongoose');
const PaymentService = require('../../services/paymentService');
const MikrotikUser = require('../../models/MikrotikUser');
const WalletTransaction = require('../../models/WalletTransaction');
const Invoice = require('../../models/Invoice');
const Transaction = require('../../models/Transaction');

describe('PaymentService', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeAll(() => {
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
    mongoose.Types = {
        ObjectId: {
          isValid: jest.fn(id => /^[0-9a-fA-F]{24}$/.test(id))
        }
      };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ... other tests ...

  describe('getTransactions', () => {
    it('should call Transaction.find with the correct query', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]), // Last call in chain resolves
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(0);

      await PaymentService.getTransactions('tenant-1', {});
      expect(Transaction.find).toHaveBeenCalled();
    });
  });

  describe('getWalletTransactions', () => {
    it('should handle chained populates correctly', async () => {
        const mockQuery = {
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            populate: jest.fn(), // We will configure this mock
        };
        // First call to populate returns the query object for chaining.
        // Second call resolves with the final data.
        mockQuery.populate
            .mockImplementationOnce(() => mockQuery)
            .mockResolvedValueOnce([]);

        WalletTransaction.find.mockReturnValue(mockQuery);
        WalletTransaction.countDocuments.mockResolvedValue(0);
  
        await PaymentService.getWalletTransactions('tenant-1', {});
  
        expect(mockQuery.populate).toHaveBeenCalledWith('mikrotikUser', 'username officialName');
        expect(mockQuery.populate).toHaveBeenCalledWith('processedBy', 'fullName');
        expect(mockQuery.populate).toHaveBeenCalledTimes(2);
      });
  });

  describe('getWalletTransactionById', () => {
    it('should handle chained populates for findOne', async () => {
        const mockQuery = {
            populate: jest.fn(),
        };
        mockQuery.populate
            .mockImplementationOnce(() => mockQuery)
            .mockResolvedValueOnce({ _id: 'tx-1' });
        
        WalletTransaction.findOne.mockReturnValue(mockQuery);

        const result = await PaymentService.getWalletTransactionById('tx-1', 'tenant-1');

        expect(WalletTransaction.findOne).toHaveBeenCalledWith({ _id: 'tx-1', tenant: 'tenant-1' });
        expect(mockQuery.populate).toHaveBeenCalledTimes(2);
        expect(result._id).toBe('tx-1');
    });

    it('should throw an error if transaction not found', async () => {
        const mockQuery = {
            populate: jest.fn(),
        };
        mockQuery.populate
            .mockImplementationOnce(() => mockQuery)
            .mockResolvedValueOnce(null); // Resolve with null to simulate not found

        WalletTransaction.findOne.mockReturnValue(mockQuery);

        await expect(PaymentService.getWalletTransactionById('tx-nonexistent', 'tenant-1')).rejects.toThrow('Wallet transaction not found');
    });
  });
});