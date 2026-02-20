const {
  getSmsProviders,
  getSmsProviderById,
  createSmsProvider,
  updateSmsProvider,
  deleteSmsProvider,
  setActiveSmsProvider,
} = require('../../controllers/smsProviderController');
const SmsProvider = require('../../models/SmsProvider');
const { validationResult } = require('express-validator');

jest.mock('../../models/SmsProvider');
jest.mock('express-validator');

describe('SMS Provider Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
      user: { tenant: 'testTenant' },
      body: {},
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

  describe('getSmsProviders', () => {
    it('should return all SMS providers', async () => {
      const mockProviders = [{ toObject: () => ({ _id: 'p1' }) }];
      SmsProvider.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProviders),
      });
      await getSmsProviders(req, res);
      expect(res.json).toHaveBeenCalledWith([{ _id: 'p1' }]);
    });
  });

  describe('getSmsProviderById', () => {
    it('should return a single SMS provider', async () => {
      const mockProvider = { toObject: () => ({ _id: 'p1' }) };
      SmsProvider.findOne.mockResolvedValue(mockProvider);
      await getSmsProviderById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ _id: 'p1' });
    });
  });

  describe('createSmsProvider', () => {
    it('should create a new SMS provider', async () => {
      const providerData = { name: 'Test Provider' };
      const mockProvider = { toObject: () => providerData };
      SmsProvider.prototype.save = jest.fn().mockResolvedValue(mockProvider);
      req.body = providerData;
      
      await createSmsProvider(req, res, next);

      expect(SmsProvider.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(providerData);
    });
  });

  describe('updateSmsProvider', () => {
    it('should update an SMS provider', async () => {
      const providerData = { name: 'Updated Provider' };
      const mockProvider = { 
        get: jest.fn().mockReturnValue({}), 
        save: jest.fn().mockResolvedValue({ toObject: () => providerData }) 
      };
      req.body = providerData;
      SmsProvider.findOne.mockResolvedValue(mockProvider);

      await updateSmsProvider(req, res, next);

      expect(mockProvider.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(providerData);
    });
  });

  describe('deleteSmsProvider', () => {
    it('should delete an SMS provider', async () => {
      const mockProvider = { _id: 'p1', deleteOne: jest.fn() };
      SmsProvider.findOne.mockResolvedValue(mockProvider);

      await deleteSmsProvider(req, res, next);

      expect(mockProvider.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'SMS provider removed' });
    });
  });

  describe('setActiveSmsProvider', () => {
    it('should set an SMS provider to active', async () => {
      const mockProvider = { name: 'Test Provider', save: jest.fn() };
      SmsProvider.findOne.mockResolvedValue(mockProvider);

      await setActiveSmsProvider(req, res, next);

      expect(mockProvider.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Test Provider has been set as the active SMS provider.' });
    });
  });
});
