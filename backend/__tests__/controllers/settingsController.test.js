const {
  getGeneralSettings,
  updateGeneralSettings,
  getMpesaSettings,
  updateMpesaSettings,
  activateMpesa,
} = require('../../controllers/settingsController');
const ApplicationSettings = require('../../models/ApplicationSettings');
const mpesaService = require('../../services/mpesaService');
const { validationResult } = require('express-validator');
const { encrypt } = require('../../utils/crypto');

jest.mock('../../models/ApplicationSettings');
jest.mock('../../services/mpesaService');
jest.mock('express-validator');
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));
jest.mock('../../utils/crypto');

describe('Settings Controller', () => {
  let req, res, next;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    req = {
      user: { tenant: 'testTenant' },
      body: {},
      files: {},
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

  describe('getGeneralSettings', () => {
    it('should return general settings', async () => {
      const mockSettings = { appName: 'Test App' };
      ApplicationSettings.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSettings),
      });
      await getGeneralSettings(req, res);
      expect(res.json).toHaveBeenCalledWith(mockSettings);
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      const mockSettings = { appName: 'Old App', save: jest.fn() };
      req.body = { appName: 'New App' };
      ApplicationSettings.findOne.mockResolvedValue(mockSettings);
      await updateGeneralSettings(req, res);
      expect(mockSettings.appName).toBe('New App');
      expect(mockSettings.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getMpesaSettings', () => {
    it('should return M-Pesa settings', async () => {
      const mockSettings = { mpesaPaybill: { shortcode: '123' } };
      ApplicationSettings.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSettings),
      });
      await getMpesaSettings(req, res);
      expect(res.json).toHaveBeenCalledWith({ mpesaPaybill: mockSettings.mpesaPaybill, mpesaTill: undefined });
    });
  });

  describe('updateMpesaSettings', () => {
    it('should update M-Pesa settings', async () => {
      const mockSettings = { mpesaPaybill: {}, save: jest.fn() };
      req.body = { type: 'paybill', data: { shortcode: '456' } };
      ApplicationSettings.findOne.mockResolvedValue(mockSettings);
      await updateMpesaSettings(req, res);
      expect(mockSettings.mpesaPaybill.shortcode).toBe('456');
      expect(mockSettings.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('activateMpesa', () => {
    it('should activate M-Pesa callback URL', async () => {
      mpesaService.registerCallbackURL.mockResolvedValue({ success: true });
      await activateMpesa(req, res, next);
      expect(mpesaService.registerCallbackURL).toHaveBeenCalledWith('testTenant');
      expect(res.json).toHaveBeenCalledWith({ message: 'M-Pesa callback URL registered successfully.', response: { success: true } });
    });
  });
});
