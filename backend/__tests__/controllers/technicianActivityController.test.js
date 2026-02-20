const {
  createTechnicianActivity,
  getTechnicianActivities,
  getTechnicianActivityById,
  updateTechnicianActivity,
  deleteTechnicianActivity,
} = require('../../controllers/technicianActivityController');
const TechnicianActivity = require('../../models/TechnicianActivity');
const { validationResult } = require('express-validator');

jest.mock('../../models/TechnicianActivity');
jest.mock('express-validator');

describe('Technician Activity Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testId' },
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

  describe('createTechnicianActivity', () => {
    it('should create a new technician activity', async () => {
      const activityData = { technician: 'tech1', activityType: 'Installation', installedEquipment: 'router', installationNotes: 'done' };
      req.body = activityData;
      TechnicianActivity.create.mockResolvedValue(activityData);

      await createTechnicianActivity(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(activityData);
    });
  });

  describe('getTechnicianActivities', () => {
    it('should return a list of technician activities', async () => {
      const mockActivities = [{ _id: 'a1' }];
      TechnicianActivity.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      });
      TechnicianActivity.find().sort().populate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockActivities),
      });
      await getTechnicianActivities(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockActivities);
    });
  });

  describe('getTechnicianActivityById', () => {
    it('should return a single technician activity', async () => {
      const mockActivity = { _id: 'a1' };
      TechnicianActivity.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });
      TechnicianActivity.findOne().populate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockActivity),
      });
      await getTechnicianActivityById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockActivity);
    });
  });

  describe('updateTechnicianActivity', () => {
    it('should update a technician activity', async () => {
      const activityData = { description: 'new desc' };
      const mockActivity = { 
        _id: 'a1', 
        activityType: 'Support', 
        supportCategory: 'Client Issue', 
        save: jest.fn().mockResolvedValue(activityData),
        technician: 'tech1',
        clientName: 'client1',
        clientPhone: '12345',
        activityDate: new Date(),
        description: 'old desc',
      };
      req.body = activityData;
      TechnicianActivity.findOne.mockResolvedValue(mockActivity);

      await updateTechnicianActivity(req, res, next);

      expect(mockActivity.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(activityData);
    });
  });

  describe('deleteTechnicianActivity', () => {
    it('should delete a technician activity', async () => {
      const mockActivity = { _id: 'a1', deleteOne: jest.fn() };
      TechnicianActivity.findOne.mockResolvedValue(mockActivity);

      await deleteTechnicianActivity(req, res, next);

      expect(mockActivity.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Technician activity removed' });
    });
  });
});
