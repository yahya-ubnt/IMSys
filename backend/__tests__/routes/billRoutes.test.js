
const request = require('supertest');
const express = require('express');
const billRoutes = require('../../routes/billRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const billController = require('../../controllers/billController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/billController', () => ({
  createBill: jest.fn((req, res) => res.status(201).json({ message: 'Bill created' })),
  getBills: jest.fn((req, res) => res.status(200).json({ message: 'Get all bills' })),
  getBillById: jest.fn((req, res) => res.status(200).json({ message: `Get bill ${req.params.id}` })),
  updateBill: jest.fn((req, res) => res.status(200).json({ message: `Update bill ${req.params.id}` })),
  deleteBill: jest.fn((req, res) => res.status(200).json({ message: `Delete bill ${req.params.id}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/bills', billRoutes);

describe('Bill Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/bills should create a new bill', async () => {
    const res = await request(app).post('/api/bills').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Bill created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(billController.createBill).toHaveBeenCalled();
  });

  it('GET /api/bills should get all bills', async () => {
    const res = await request(app).get('/api/bills');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all bills' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(billController.getBills).toHaveBeenCalled();
  });

  it('GET /api/bills/:id should get a bill by ID', async () => {
    const billId = 'bill123';
    const res = await request(app).get(`/api/bills/${billId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get bill ${billId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(billController.getBillById).toHaveBeenCalled();
  });

  it('PUT /api/bills/:id should update a bill by ID', async () => {
    const billId = 'bill123';
    const res = await request(app).put(`/api/bills/${billId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update bill ${billId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(billController.updateBill).toHaveBeenCalled();
  });

  it('DELETE /api/bills/:id should delete a bill by ID', async () => {
    const billId = 'bill123';
    const res = await request(app).delete(`/api/bills/${billId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete bill ${billId}` });
    expect(isSuperAdminOrAdmin).toHaveBeenCalled(); // protect is not directly on delete route
    expect(billController.deleteBill).toHaveBeenCalled();
  });
});
