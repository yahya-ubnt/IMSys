
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
    ...jest.requireActual('crypto'), // Keep other crypto functions working
    randomUUID: jest.fn(() => 'mock-uuid'),
}));
jest.mock('moment', () => {
    const moment = jest.requireActual('moment');
    const mockDate = '2024-01-01T00:00:00.000Z';
    const momentWrapper = (...args) => {
        if (args.length > 0) {
            return moment(...args);
        }
        return moment(mockDate);
    };
    Object.assign(momentWrapper, moment);
    return momentWrapper;
});


const mongoose = require('mongoose');
const PaymentService = require('../../services/paymentService');
const MikrotikUser = require('../../models/MikrotikUser');
const WalletTransaction = require('../../models/WalletTransaction');
const Invoice = require('../../models/Invoice');
const Transaction = require('../../models/Transaction');
const mikrotikSyncQueue = require('../../queues/mikrotikSyncQueue');


describe('PaymentService', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeAll(() => {
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSession.startTransaction.mockClear();
    mockSession.commitTransaction.mockClear();
    mockSession.abortTransaction.mockClear();
    mockSession.endSession.mockClear();
  });

  // ... existing passing tests for createWalletTransaction and processSubscriptionPayment
  describe('createWalletTransaction', () => {
    it('should create a credit transaction and update user wallet', async () => {
        MikrotikUser.findByIdAndUpdate.mockResolvedValue({ _id: 'userId', walletBalance: 150 });
        WalletTransaction.create.mockResolvedValue([{}]);
  
        await PaymentService.createWalletTransaction({ userId: 'userId', type: 'Credit', amount: 50 }, 'adminId');
  
        expect(MikrotikUser.findByIdAndUpdate).toHaveBeenCalledWith('userId', { $inc: { walletBalance: 50 } }, expect.anything());
        expect(WalletTransaction.create).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ type: 'Credit', amount: 50 })]), expect.anything());
        expect(mockSession.commitTransaction).toHaveBeenCalled();
      });
  
      it('should create a debit transaction and update user wallet', async () => {
        MikrotikUser.findOneAndUpdate.mockResolvedValue({ _id: 'userId', walletBalance: 50 });
        WalletTransaction.create.mockResolvedValue([{}]);
  
        await PaymentService.createWalletTransaction({ userId: 'userId', type: 'Debit', amount: 50 }, 'adminId');
  
        expect(MikrotikUser.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'userId', walletBalance: { $gte: 50 } }, { $inc: { walletBalance: -50 } }, expect.anything());
        expect(WalletTransaction.create).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ type: 'Debit', amount: 50 })]), expect.anything());
        expect(mockSession.commitTransaction).toHaveBeenCalled();
      });
  
      it('should throw an error for a debit with insufficient funds', async () => {
        MikrotikUser.findOneAndUpdate.mockResolvedValue(null);
  
        await expect(PaymentService.createWalletTransaction({ userId: 'userId', type: 'Debit', amount: 150 }, 'adminId')).rejects.toThrow('Insufficient wallet balance.');
  
        expect(mockSession.abortTransaction).toHaveBeenCalled();
      });
  });

  describe('processSubscriptionPayment', () => {
    it('should renew an expired user for 1 month and credit the rest', async () => {
        const packagePrice = 1000;
        const user = {
            _id: 'userId',
            walletBalance: 0,
            expiryDate: new Date('2023-12-01T00:00:00.000Z'),
            isSuspended: true,
            isManuallyDisconnected: false,
            package: { price: packagePrice },
            save: jest.fn().mockReturnThis(),
        };

        user.walletBalance = 1500; 
        MikrotikUser.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValue(user),
        });
        
        WalletTransaction.create.mockResolvedValue([{}]);

        await PaymentService.processSubscriptionPayment('userId', 1500, 'M-Pesa', 'TX123', null, mockSession);

        expect(user.save).toHaveBeenCalled();
        const expectedExpiry = new Date('2024-02-01T00:00:00.000Z');
        expect(user.expiryDate.toISOString()).toBe(expectedExpiry.toISOString());
        expect(user.walletBalance).toBe(500);
        expect(user.isSuspended).toBe(false);
        expect(user.syncStatus).toBe('pending');
        expect(mikrotikSyncQueue.add).toHaveBeenCalledWith('syncUser', { mikrotikUserId: 'userId', tenantId: undefined });
    });

    it('should buy multiple future months if balance is sufficient', async () => {
        const packagePrice = 1000;
        const user = {
            _id: 'userId',
            walletBalance: 0,
            expiryDate: new Date('2024-01-15T00:00:00.000Z'),
            package: { price: packagePrice },
            save: jest.fn().mockReturnThis(),
        };

        user.walletBalance = 2500;
        MikrotikUser.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValue(user),
        });

        WalletTransaction.create.mockResolvedValue([{}]);

        await PaymentService.processSubscriptionPayment('userId', 2500, 'M-Pesa', 'TX123', null, mockSession);

        expect(user.save).toHaveBeenCalled();
        const expectedExpiry = new Date('2024-03-15T00:00:00.000Z');
        expect(user.expiryDate.toISOString()).toBe(expectedExpiry.toISOString());
        expect(user.walletBalance).toBe(500);
        expect(mikrotikSyncQueue.add).not.toHaveBeenCalled();
    });

    it('should just credit the wallet if user has no package', async () => {
        const user = {
            _id: 'userId',
            walletBalance: 0,
            package: null,
            save: jest.fn().mockReturnThis(),
        };

        user.walletBalance = 500;
        MikrotikUser.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValue(user),
        });
        WalletTransaction.create.mockResolvedValue([{}]);

        await PaymentService.processSubscriptionPayment('userId', 500, 'Cash', 'TX123', 'adminId', mockSession);

        expect(WalletTransaction.create).toHaveBeenCalledTimes(1);
        expect(user.save).not.toHaveBeenCalled();
        expect(user.expiryDate).toBeUndefined();
        expect(mikrotikSyncQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('handleSuccessfulPayment', () => {
    beforeEach(() => {
      // Spy on processSubscriptionPayment to ensure it's called, without re-testing its internal logic
      jest.spyOn(PaymentService, 'processSubscriptionPayment').mockResolvedValue();
    });

    it('should process an invoice payment', async () => {
      const user = { _id: 'userId', officialName: 'Test User' };
      const invoice = {
        invoiceNumber: 'INV-123',
        status: 'Unpaid',
        mikrotikUser: user,
        save: jest.fn().mockResolvedValue(true),
      };

      Invoice.findOne.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(invoice),
      });
      Transaction.create.mockResolvedValue([{}]);

      const params = {
        tenant: 'tenantId',
        amount: 1000,
        transactionId: 'TX123',
        reference: 'INV-123',
        paymentMethod: 'M-Pesa',
      };

      await PaymentService.handleSuccessfulPayment(params);

      expect(Invoice.findOne).toHaveBeenCalledWith(expect.objectContaining({ invoiceNumber: 'INV-123' }));
      expect(invoice.save).toHaveBeenCalled();
      expect(invoice.status).toBe('Paid');
      expect(PaymentService.processSubscriptionPayment).toHaveBeenCalledWith(user._id, 1000, 'M-Pesa', 'TX123', null, mockSession);
      expect(Transaction.create).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should process a user payment via mPesaRefNo', async () => {
      const user = { _id: 'userId', officialName: 'Test User', mPesaRefNo: 'MP123' };
      
      MikrotikUser.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(user),
      });
      Transaction.create.mockResolvedValue([{}]);

      const params = {
        tenant: 'tenantId',
        amount: 500,
        transactionId: 'TX456',
        reference: 'MP123',
        paymentMethod: 'M-Pesa',
      };

      await PaymentService.handleSuccessfulPayment(params);

      expect(MikrotikUser.findOne).toHaveBeenCalledWith(expect.objectContaining({ mPesaRefNo: 'MP123' }));
      expect(PaymentService.processSubscriptionPayment).toHaveBeenCalledWith(user._id, 500, 'M-Pesa', 'TX456', null, mockSession);
      expect(Transaction.create).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should handle user not found and abort transaction', async () => {
        MikrotikUser.findOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(null),
        });

        const params = {
            tenant: 'tenantId',
            amount: 500,
            transactionId: 'TX789',
            reference: 'UNKNOWN',
            paymentMethod: 'M-Pesa',
        };

        await PaymentService.handleSuccessfulPayment(params);

        expect(mockSession.abortTransaction).toHaveBeenCalled();
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        // Optional: Check if an alert was created
        // MpesaAlert.create would be called in the catch block
    });
  });
});
