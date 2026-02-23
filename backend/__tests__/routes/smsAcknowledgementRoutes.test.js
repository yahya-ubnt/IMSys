
const request = require('supertest');
const express = require('express');
const smsAcknowledgementRoutes = require('../../routes/smsAcknowledgementRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const smsAcknowledgementController = require('../../controllers/smsAcknowledgementController');
const { body, param } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/smsAcknowledgementController', () => ({
  getAcknowledgements: jest.fn((req, res) => res.status(200).json({ message: 'Get all SMS acknowledgements' })),
  createAcknowledgement: jest.fn((req, res) => res.status(201).json({ message: 'SMS acknowledgement created' })),
  getAcknowledgementById: jest.fn((req, res) => res.status(200).json({ message: `Get SMS acknowledgement ${req.params.id}` })),
  updateAcknowledgement: jest.fn((req, res) => res.status(200).json({ message: `SMS acknowledgement ${req.params.id} updated` })),
  deleteAcknowledgement: jest.fn((req, res) => res.status(200).json({ message: `SMS acknowledgement ${req.params.id} deleted` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      trim: jest.fn().mockReturnThis(),
      notEmpty: jest.fn().mockReturnThis(),
      withMessage: jest.fn().mockReturnThis(),
      isMongoId: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      isIn: jest.fn().mockReturnThis(),
    };
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChainable);
  
    return {
      body: jest.fn(() => mockMiddleware),
      param: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

const app = express();
app.use(express.json());
app.use('/api/sms-acknowledgements', smsAcknowledgementRoutes);

describe('SMS Acknowledgement Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const ackId = 'ack123';

  it('GET /api/sms-acknowledgements should get all SMS acknowledgements', async () => {
    const res = await request(app).get('/api/sms-acknowledgements');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Get all SMS acknowledgements' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsAcknowledgementController.getAcknowledgements).toHaveBeenCalled();
  });

  it('POST /api/sms-acknowledgements should create a new SMS acknowledgement', async () => {
    const res = await request(app).post('/api/sms-acknowledgements').send({});
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'SMS acknowledgement created' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsAcknowledgementController.createAcknowledgement).toHaveBeenCalled();
  });

  it('GET /api/sms-acknowledgements/:id should get an SMS acknowledgement by ID', async () => {
    const res = await request(app).get(`/api/sms-acknowledgements/${ackId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Get SMS acknowledgement ${ackId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsAcknowledgementController.getAcknowledgementById).toHaveBeenCalled();
  });

  it('PUT /api/sms-acknowledgements/:id should update an SMS acknowledgement by ID', async () => {
    const res = await request(app).put(`/api/sms-acknowledgements/${ackId}`).send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS acknowledgement ${ackId} updated` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsAcknowledgementController.updateAcknowledgement).toHaveBeenCalled();
  });

  it('DELETE /api/sms-acknowledgements/:id should delete an SMS acknowledgement by ID', async () => {
    const res = await request(app).delete(`/api/sms-acknowledgements/${ackId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `SMS acknowledgement ${ackId} deleted` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(smsAcknowledgementController.deleteAcknowledgement).toHaveBeenCalled();
  });
});
