
const request = require('supertest');
const express = require('express');
const leadRoutes = require('../../routes/leadRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const leadController = require('../../controllers/leadController');
const { body } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/leadController', () => ({
  createLead: jest.fn((req, res) => res.status(201).json({ message: 'Lead created' })),
  getAllLeads: jest.fn((req, res) => res.status(200).json({ message: 'Get all leads' })),
  getLeadById: jest.fn((req, res) => res.status(200).json({ message: `Get lead ${req.params.id}` })),
  updateLead: jest.fn((req, res) => res.status(200).json({ message: `Update lead ${req.params.id}` })),
  deleteLead: jest.fn((req, res) => res.status(200).json({ message: `Delete lead ${req.params.id}` })),
  updateLeadStatus: jest.fn((req, res) => res.status(200).json({ message: `Update lead ${req.params.id} status` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
      isIn: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      isEmail: jest.fn().mockReturnThis(),
    };
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChainable);
  
    return {
      body: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

const app = express();
app.use(express.json());
app.use('/api/leads', leadRoutes);

describe('Lead Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/leads should create a new lead', async () => {
    const res = await request(app).post('/api/leads').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Lead created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(leadController.createLead).toHaveBeenCalled();
  });

  it('GET /api/leads should get all leads', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all leads' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(leadController.getAllLeads).toHaveBeenCalled();
  });

  it('GET /api/leads/:id should get a lead by ID', async () => {
    const leadId = 'lead123';
    const res = await request(app).get(`/api/leads/${leadId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get lead ${leadId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(leadController.getLeadById).toHaveBeenCalled();
  });

  it('PUT /api/leads/:id should update a lead by ID', async () => {
    const leadId = 'lead123';
    const res = await request(app).put(`/api/leads/${leadId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update lead ${leadId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(leadController.updateLead).toHaveBeenCalled();
  });

  it('DELETE /api/leads/:id should delete a lead by ID', async () => {
    const leadId = 'lead123';
    const res = await request(app).delete(`/api/leads/${leadId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Delete lead ${leadId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(leadController.deleteLead).toHaveBeenCalled();
  });

  it('PUT /api/leads/status/:id should update a lead status', async () => {
    const leadId = 'lead123';
    const res = await request(app).put(`/api/leads/status/${leadId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Update lead ${leadId} status` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(leadController.updateLeadStatus).toHaveBeenCalled();
  });
});
