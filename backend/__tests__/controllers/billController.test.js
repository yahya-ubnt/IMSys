const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
} = require('../../controllers/billController');
const Bill = require('../../models/Bill');
const Tenant = require('../../models/Tenant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Bill Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Bill.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Bill Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createBill', () => {
    it('should create a new bill successfully', async () => {
      req.body = {
        name: 'Electricity Bill',
        amount: 500,
        dueDate: 15, // Day of month
        category: 'Company',
        description: 'Monthly electricity'
      };

      await createBill(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const bill = await Bill.findOne({ name: 'Electricity Bill' });
      expect(bill).toBeDefined();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Electricity Bill' }));
    });

    it('should throw error if required fields are missing', async () => {
        req.body = { name: 'Incomplete Bill' };
        await createBill(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw error if duplicate bill for the same month exists', async () => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        await Bill.create({
            name: 'Rent',
            amount: 1000,
            dueDate: 1,
            category: 'Personal',
            tenant: tenant._id,
            month: currentMonth,
            year: currentYear,
            status: 'Not Paid'
        });

        req.body = {
            name: 'Rent',
            amount: 1000,
            dueDate: 1,
            category: 'Personal'
        };

        await createBill(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getBills', () => {
    it('should return bills for the current month', async () => {
      const currentMonth = new Date().getMonth() + 1;
      await Bill.create({
        name: 'Water',
        amount: 200,
        dueDate: 10,
        category: 'Company',
        tenant: tenant._id,
        month: currentMonth,
        year: new Date().getFullYear(),
        status: 'Not Paid'
      });

      await getBills(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({ name: 'Water' })
      ]));
    });
  });

  describe('updateBill', () => {
    it('should update a bill successfully', async () => {
      const bill = await Bill.create({
        name: 'Internet',
        amount: 300,
        dueDate: 5,
        category: 'Company',
        tenant: tenant._id,
        month: 1,
        year: 2024,
        status: 'Not Paid'
      });

      req.params.id = bill._id;
      req.body = { status: 'Paid', method: 'M-Pesa' };

      await updateBill(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      const updatedBill = await Bill.findById(bill._id);
      expect(updatedBill.status).toBe('Paid');
      expect(updatedBill.method).toBe('M-Pesa');
    });

    it('should throw error if bill not found', async () => {
        req.params.id = new mongoose.Types.ObjectId();
        await updateBill(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteBill', () => {
    it('should delete a bill successfully', async () => {
        const bill = await Bill.create({
            name: 'Garbage',
            amount: 50,
            dueDate: 20,
            category: 'Personal',
            tenant: tenant._id,
            month: 1,
            year: 2024,
            status: 'Not Paid'
        });

        req.params.id = bill._id;
        await deleteBill(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        const deleted = await Bill.findById(bill._id);
        expect(deleted).toBeNull();
    });
  });
});
