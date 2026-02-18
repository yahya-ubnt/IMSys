const {
  createExpenseType,
  getExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
} = require('../../controllers/expenseTypeController');
const ExpenseType = require('../../models/ExpenseType');
const { validationResult } = require('express-validator');

jest.mock('../../models/ExpenseType');
jest.mock('express-validator');

describe('ExpenseType Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testExpenseType' },
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

  describe('createExpenseType', () => {
    it('should create an expense type', async () => {
      const expenseTypeData = { name: 'Test Type', description: 'Test Desc' };
      req.body = expenseTypeData;
      ExpenseType.findOne.mockResolvedValue(null);
      ExpenseType.create.mockResolvedValue(expenseTypeData);

      await createExpenseType(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expenseTypeData);
    });

    it('should return 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });

      await createExpenseType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });

    it('should return 400 if expense type with name already exists', async () => {
      const expenseTypeData = { name: 'Existing Type', description: 'Test Desc' };
      req.body = expenseTypeData;
      ExpenseType.findOne.mockResolvedValue(expenseTypeData);

      await createExpenseType(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Expense type with this name already exists'));
    });
  });

  describe('getExpenseTypes', () => {
    it('should return all expense types for a tenant', async () => {
      const expenseTypes = [{ name: 'Type 1' }, { name: 'Type 2' }];
      ExpenseType.find.mockResolvedValue(expenseTypes);

      await getExpenseTypes(req, res);

      expect(ExpenseType.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expenseTypes);
    });
  });

  describe('getExpenseTypeById', () => {
    it('should return a single expense type', async () => {
      const expenseType = { name: 'Test Type' };
      ExpenseType.findOne.mockResolvedValue(expenseType);

      await getExpenseTypeById(req, res);

      expect(ExpenseType.findOne).toHaveBeenCalledWith({ _id: 'testExpenseType', tenant: 'testTenant' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expenseType);
    });

    it('should return 404 if expense type not found', async () => {
      ExpenseType.findOne.mockResolvedValue(null);

      await getExpenseTypeById(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Expense type not found'));
    });
  });

  describe('updateExpenseType', () => {
    it('should update an expense type', async () => {
      const mockExpenseType = {
        name: 'Old Name',
        save: jest.fn().mockResolvedValue({ name: 'New Name' }),
      };
      ExpenseType.findOne.mockResolvedValue(mockExpenseType);
      req.body = { name: 'New Name' };

      await updateExpenseType(req, res);

      expect(mockExpenseType.name).toBe('New Name');
      expect(mockExpenseType.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('should return 404 if expense type not found', async () => {
      ExpenseType.findOne.mockResolvedValue(null);

      await updateExpenseType(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Expense type not found'));
    });
  });

  describe('deleteExpenseType', () => {
    it('should delete an expense type', async () => {
      const mockExpenseType = {
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      ExpenseType.findOne.mockResolvedValue(mockExpenseType);

      await deleteExpenseType(req, res);

      expect(mockExpenseType.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Expense type removed' });
    });

    it('should return 404 if expense type not found', async () => {
      ExpenseType.findOne.mockResolvedValue(null);

      await deleteExpenseType(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Expense type not found'));
    });
  });
});