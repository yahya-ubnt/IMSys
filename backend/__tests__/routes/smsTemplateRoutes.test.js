
const request = require('supertest');
const express = require('express');
const smsTemplateRoutes = require('../../routes/smsTemplateRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const smsTemplateController = require('../../controllers/smsTemplateController');
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
jest.mock('../../controllers/smsTemplateController', () => ({
  getTemplates: jest.fn((req, res) => res.status(200).json({ message: 'Get all SMS templates' })),
  getTemplateById: jest.fn((req, res) => res.status(200).json({ message: `Get SMS template ${req.params.id}` })),
  createTemplate: jest.fn((req, res) => res.status(201).json({ message: 'SMS template created' })),
  updateTemplate: jest.fn((req, res) => res.status(200).json({ message: `SMS template ${req.params.id} updated` })),
  deleteTemplate: jest.fn((req, res) => res.status(200).json({ message: `SMS template ${req.params.id} deleted` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      not: jest.fn().mockReturnThis(),
      isEmpty: jest.fn().mockReturnThis(),
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
app.use('/api/sms-templates', smsTemplateRoutes);

describe('SMS Template Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const templateId = 'template123';

  it('GET /api/sms-templates should get all SMS templates', async () => {
    const res = await request(app).get('/api/sms-templates');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all SMS templates' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsTemplateController.getTemplates).toHaveBeenCalled();
  });

  it('POST /api/sms-templates should create a new SMS template', async () => {
    const res = await request(app).post('/api/sms-templates').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'SMS template created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsTemplateController.createTemplate).toHaveBeenCalled();
  });

  it('GET /api/sms-templates/:id should get an SMS template by ID', async () => {
    const res = await request(app).get(`/api/sms-templates/${templateId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get SMS template ${templateId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsTemplateController.getTemplateById).toHaveBeenCalled();
  });

  it('PUT /api/sms-templates/:id should update an SMS template by ID', async () => {
    const res = await request(app).put(`/api/sms-templates/${templateId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS template ${templateId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsTemplateController.updateTemplate).toHaveBeenCalled();
  });

  it('DELETE /api/sms-templates/:id should delete an SMS template by ID', async () => {
    const res = await request(app).delete(`/api/sms-templates/${templateId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS template ${templateId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsTemplateController.deleteTemplate).toHaveBeenCalled();
  });
});
