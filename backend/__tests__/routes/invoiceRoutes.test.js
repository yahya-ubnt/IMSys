
const request = require('supertest');
const express = require('express');
const invoiceRoutes = require('../../routes/invoiceRoutes');
const { protect, isAdmin } = require('../../middlewares/protect');
const invoiceController = require('../../controllers/invoiceController');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/invoiceController', () => ({
  getInvoices: jest.fn((req, res) => res.status(200).json({ message: 'Get all invoices' })),
  getInvoiceById: jest.fn((req, res) => res.status(200).json({ message: `Get invoice ${req.params.id}` })),
  createInvoice: jest.fn((req, res) => res.status(201).json({ message: 'Invoice created' })),
  payInvoice: jest.fn((req, res) => res.status(200).json({ message: `Invoice ${req.params.id} paid` })),
  getInvoiceStats: jest.fn((req, res) => res.status(200).json({ message: 'Invoice stats' })),
  downloadInvoicePDF: jest.fn((req, res) => res.status(200).json({ message: `Download PDF for invoice ${req.params.id}` })),
}));

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);

describe('Invoice Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/invoices/stats should get invoice statistics (admin only)', async () => {
    const res = await request(app).get('/api/invoices/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Invoice stats' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(invoiceController.getInvoiceStats).toHaveBeenCalled();
  });

  it('POST /api/invoices should create a new invoice (admin only)', async () => {
    const res = await request(app).post('/api/invoices').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Invoice created' });
    expect(protect).toHaveBeenCalled();
    expect(isAdmin).toHaveBeenCalled();
    expect(invoiceController.createInvoice).toHaveBeenCalled();
  });

  it('GET /api/invoices should get all invoices (protected)', async () => {
    const res = await request(app).get('/api/invoices');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all invoices' });
    expect(protect).toHaveBeenCalled();
    expect(invoiceController.getInvoices).toHaveBeenCalled();
  });

  it('GET /api/invoices/:id should get an invoice by ID (protected)', async () => {
    const invoiceId = 'invoice123';
    const res = await request(app).get(`/api/invoices/${invoiceId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get invoice ${invoiceId}` });
    expect(protect).toHaveBeenCalled();
    expect(invoiceController.getInvoiceById).toHaveBeenCalled();
  });

  it('GET /api/invoices/:id/pdf should download invoice PDF (protected)', async () => {
    const invoiceId = 'invoice123';
    const res = await request(app).get(`/api/invoices/${invoiceId}/pdf`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Download PDF for invoice ${invoiceId}` });
    expect(protect).toHaveBeenCalled();
    expect(invoiceController.downloadInvoicePDF).toHaveBeenCalled();
  });

  it('POST /api/invoices/:id/pay should pay an invoice (protected)', async () => {
    const invoiceId = 'invoice123';
    const res = await request(app).post(`/api/invoices/${invoiceId}/pay`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Invoice ${invoiceId} paid` });
    expect(protect).toHaveBeenCalled();
    expect(invoiceController.payInvoice).toHaveBeenCalled();
  });
});
