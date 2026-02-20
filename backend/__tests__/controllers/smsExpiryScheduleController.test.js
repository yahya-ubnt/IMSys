const {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../../controllers/smsExpiryScheduleController');
const SmsExpirySchedule = require('../../models/SmsExpirySchedule');
const { validationResult } = require('express-validator');

jest.mock('../../models/SmsExpirySchedule');
jest.mock('express-validator');

describe('SMS Expiry Schedule Controller', () => {
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

  describe('getSchedules', () => {
    it('should return all SMS expiry schedules', async () => {
      const mockSchedules = [{ _id: 's1' }];
      SmsExpirySchedule.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSchedules),
      });
      await getSchedules(req, res);
      expect(res.json).toHaveBeenCalledWith(mockSchedules);
    });
  });

  describe('getScheduleById', () => {
    it('should return a single SMS expiry schedule', async () => {
      const mockSchedule = { _id: 's1' };
      SmsExpirySchedule.findOne.mockResolvedValue(mockSchedule);
      await getScheduleById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockSchedule);
    });
  });

  describe('createSchedule', () => {
    it('should create a new SMS expiry schedule', async () => {
      const scheduleData = { name: 'Test Schedule' };
      req.body = scheduleData;
      SmsExpirySchedule.findOne.mockResolvedValue(null);
      SmsExpirySchedule.create.mockResolvedValue(scheduleData);

      await createSchedule(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(scheduleData);
    });
  });

  describe('updateSchedule', () => {
    it('should update an SMS expiry schedule', async () => {
      const scheduleData = { name: 'Updated Schedule' };
      const mockSchedule = { _id: 's1', save: jest.fn().mockResolvedValue(scheduleData) };
      req.body = scheduleData;
      SmsExpirySchedule.findOne.mockResolvedValue(mockSchedule);

      await updateSchedule(req, res, next);

      expect(mockSchedule.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(scheduleData);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete an SMS expiry schedule', async () => {
      const mockSchedule = { _id: 's1', deleteOne: jest.fn() };
      SmsExpirySchedule.findOne.mockResolvedValue(mockSchedule);

      await deleteSchedule(req, res, next);

      expect(mockSchedule.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'SMS Expiry Schedule removed' });
    });
  });
});
