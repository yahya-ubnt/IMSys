const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../../controllers/smsTemplateController');
const SmsTemplate = require('../../models/SmsTemplate');
const { validationResult } = require('express-validator');

jest.mock('../../models/SmsTemplate');
jest.mock('express-validator');

describe('SMS Template Controller', () => {
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

  describe('getTemplates', () => {
    it('should return all SMS templates', async () => {
      const mockTemplates = [{ _id: 't1' }];
      SmsTemplate.find.mockResolvedValue(mockTemplates);
      await getTemplates(req, res);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
    });
  });

  describe('getTemplateById', () => {
    it('should return a single SMS template', async () => {
      const mockTemplate = { _id: 't1' };
      SmsTemplate.findOne.mockResolvedValue(mockTemplate);
      await getTemplateById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockTemplate);
    });
  });

  describe('createTemplate', () => {
    it('should create a new SMS template', async () => {
      const templateData = { name: 'Test Template' };
      req.body = templateData;
      SmsTemplate.findOne.mockResolvedValue(null);
      SmsTemplate.create.mockResolvedValue(templateData);

      await createTemplate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(templateData);
    });
  });

  describe('updateTemplate', () => {
    it('should update an SMS template', async () => {
      const templateData = { name: 'Updated Template' };
      const mockTemplate = { _id: 't1', save: jest.fn().mockResolvedValue(templateData) };
      req.body = templateData;
      SmsTemplate.findOne.mockResolvedValue(mockTemplate);

      await updateTemplate(req, res, next);

      expect(mockTemplate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(templateData);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete an SMS template', async () => {
      const mockTemplate = { _id: 't1', deleteOne: jest.fn() };
      SmsTemplate.findOne.mockResolvedValue(mockTemplate);

      await deleteTemplate(req, res, next);

      expect(mockTemplate.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'SMS Template removed' });
    });
  });
});
