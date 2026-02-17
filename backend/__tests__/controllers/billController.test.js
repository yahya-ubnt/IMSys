const { createBill, getBills, getBillById, updateBill, deleteBill } = require('../../controllers/billController');
const Bill = require('../../models/Bill');
const { validationResult } = require('express-validator');

jest.mock('../../models/Bill');
jest.mock('express-validator');

describe('billController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'tenant-1' },
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBill', () => {
    it('should create a bill successfully', async () => {
      req.body = { name: 'Test Bill', amount: 100, dueDate: new Date(), category: 'Test' };
      Bill.findOne.mockResolvedValue(null);
      Bill.create.mockResolvedValue(req.body);

      await createBill(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(req.body);
    });

    it('should return 400 if required fields are missing', async () => {
        req.body = { name: 'Test Bill' }; // Missing amount, dueDate, category
        await createBill(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
  });

  describe('getBills', () => {
    it('should get all bills for the current month', async () => {
      const mockBills = [{ name: 'Bill 1' }, { name: 'Bill 2' }];
      Bill.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockBills) });

      await getBills(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBills);
    });
  });

  describe('getBillById', () => {
    it('should get a single bill by ID', async () => {
      req.params.id = 'bill-1';
      const mockBill = { _id: 'bill-1', name: 'Test Bill' };
      Bill.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockBill) });

      await getBillById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBill);
    });
  });

  describe('updateBill', () => {
    it('should update a bill successfully', async () => {
        req.params.id = 'bill-1';
        req.body = { name: 'Updated Bill' };
        const mockBill = { 
          _id: 'bill-1', 
          name: 'Old Bill',
          save: jest.fn().mockResolvedValue({ _id: 'bill-1', name: 'Updated Bill' })
        };
        Bill.findOne.mockResolvedValue(mockBill);
        validationResult.mockReturnValue({ isEmpty: () => true });
    
        await updateBill(req, res, next);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Bill' }));
      });
  });

  describe('deleteBill', () => {
    it('should delete a bill successfully', async () => {
        req.params.id = 'bill-1';
        const mockBill = { 
          _id: 'bill-1', 
          deleteOne: jest.fn().mockResolvedValue(true)
        };
        Bill.findOne.mockResolvedValue(mockBill);
    
        await deleteBill(req, res, next);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Bill removed' });
      });
  });
});
