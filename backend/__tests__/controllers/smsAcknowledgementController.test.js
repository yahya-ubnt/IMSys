const {
  getAcknowledgements,
  getAcknowledgementById,
  createAcknowledgement,
  updateAcknowledgement,
  deleteAcknowledgement,
} = require('../../controllers/smsAcknowledgementController');
const SmsAcknowledgement = require('../../models/SmsAcknowledgement');
const SmsTemplate = require('../../models/SmsTemplate');
const { validationResult } = require('express-validator');

jest.mock('../../models/SmsAcknowledgement');
jest.mock('../../models/SmsTemplate');
jest.mock('express-validator');

describe('SMS Acknowledgement Controller', () => {
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

  describe('getAcknowledgements', () => {
    it('should return all SMS acknowledgements', async () => {
      const mockAcks = [{ _id: 'ack1' }];
      SmsAcknowledgement.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAcks),
      });
      await getAcknowledgements(req, res);
      expect(res.json).toHaveBeenCalledWith(mockAcks);
    });
  });

  describe('getAcknowledgementById', () => {
    it('should return a single SMS acknowledgement', async () => {
      const mockAck = { _id: 'ack1' };
      SmsAcknowledgement.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAck),
      });
      await getAcknowledgementById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(mockAck);
    });
  });

  describe('createAcknowledgement', () => {
    it('should create a new SMS acknowledgement', async () => {
      const ackData = { triggerType: 'test', smsTemplate: 'tmpl1' };
      req.body = ackData;
      SmsTemplate.findOne.mockResolvedValue({ _id: 'tmpl1' });
      SmsAcknowledgement.findOne.mockResolvedValue(null);
      SmsAcknowledgement.create.mockResolvedValue(ackData);

      await createAcknowledgement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(ackData);
    });
  });

  describe('updateAcknowledgement', () => {
    it('should update an SMS acknowledgement', async () => {
      const ackData = { description: 'new desc' };
      const mockAck = { _id: 'ack1', save: jest.fn().mockResolvedValue(ackData) };
      req.body = ackData;
      SmsAcknowledgement.findOne.mockResolvedValue(mockAck);

      await updateAcknowledgement(req, res, next);

      expect(mockAck.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(ackData);
    });
  });

  describe('deleteAcknowledgement', () => {
    it('should delete an SMS acknowledgement', async () => {
      const mockAck = { _id: 'ack1', deleteOne: jest.fn() };
      SmsAcknowledgement.findOne.mockResolvedValue(mockAck);

      await deleteAcknowledgement(req, res, next);

      expect(mockAck.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'SMS Acknowledgement mapping removed' });
    });
  });
});
