
const request = require('supertest');
const express = require('express');
const voucherRoutes = require('../../routes/voucherRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const voucherController = require('../../controllers/voucherController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/voucherController', () => ({
  generateVouchers: jest.fn((req, res) => res.status(201).json({ message: 'Vouchers generated' })),
  getVouchers: jest.fn((req, res) => res.status(200).json({ message: 'Get all vouchers' })),
  deleteVoucherBatch: jest.fn((req, res) => res.status(200).json({ message: `Voucher batch ${req.params.batchId} deleted` })),
  loginVoucher: jest.fn((req, res) => res.status(200).json({ message: 'Voucher logged in' })),
}));

const app = express();
app.use(express.json());
app.use('/api/vouchers', voucherRoutes);

describe('Voucher Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const batchId = 'batch123';

  it('POST /api/vouchers/login should log in a voucher', async () => {
    const res = await request(app).post('/api/vouchers/login').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Voucher logged in' });
    expect(voucherController.loginVoucher).toHaveBeenCalled();
  });

  it('POST /api/vouchers should generate vouchers', async () => {
    const res = await request(app).post('/api/vouchers').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Vouchers generated' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(voucherController.generateVouchers).toHaveBeenCalled();
  });

  it('GET /api/vouchers should get all vouchers', async () => {
    const res = await request(app).get('/api/vouchers');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all vouchers' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(voucherController.getVouchers).toHaveBeenCalled();
  });

  it('DELETE /api/vouchers/batch/:batchId should delete a voucher batch', async () => {
    const res = await request(app).delete(`/api/vouchers/batch/${batchId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Voucher batch ${batchId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(voucherController.deleteVoucherBatch).toHaveBeenCalled();
  });
});
