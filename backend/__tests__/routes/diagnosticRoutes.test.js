
const request = require('supertest');
const express = require('express');
const diagnosticRoutes = require('../../routes/diagnosticRoutes');
const { protect, isSuperAdminOrAdmin } = require('../../middlewares/protect');
const diagnosticController = require('../../controllers/diagnosticController');
const { param } = require('express-validator');

// Mock middlewares
jest.mock('../../middlewares/protect', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'user123', tenant: 'tenant123', roles: ['ADMIN'] };
    next();
  }),
  isSuperAdminOrAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/diagnosticController', () => ({
  runDiagnostic: jest.fn((req, res) => res.status(200).json({ message: 'Diagnostic run' })),
  getDiagnosticHistory: jest.fn((req, res) => res.status(200).json({ message: 'Diagnostic history' })),
  getDiagnosticLogById: jest.fn((req, res) => res.status(200).json({ message: `Diagnostic log ${req.params.logId}` })),
}));

// Mock express-validator to bypass actual validation logic in tests
jest.mock('express-validator', () => {
    const mockChainable = {
      isMongoId: jest.fn().mockReturnThis(),
      // Add other methods as needed
    };
  
    const mockMiddleware = (req, res, next) => next();
    Object.assign(mockMiddleware, mockChainable);
  
    return {
      param: jest.fn(() => mockMiddleware),
      validationResult: jest.fn(() => ({
        isEmpty: () => true, // Always pass validation
      })),
    };
  });

const app = express();
app.use(express.json());
app.use('/api/diagnostics', diagnosticRoutes);

describe('Diagnostic Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/diagnostics should run a diagnostic', async () => {
    const res = await request(app).post('/api/diagnostics?userId=user123').send({});
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Diagnostic run' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(diagnosticController.runDiagnostic).toHaveBeenCalled();
  });

  it('GET /api/diagnostics should get diagnostic history', async () => {
    const res = await request(app).get('/api/diagnostics?userId=user123');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Diagnostic history' });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(diagnosticController.getDiagnosticHistory).toHaveBeenCalled();
  });

  it('GET /api/diagnostics/:logId should get a diagnostic log by ID', async () => {
    const logId = 'log123';
    const res = await request(app).get(`/api/diagnostics/${logId}?userId=user123`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: `Diagnostic log ${logId}` });
    expect(protect).toHaveBeenCalled();
    expect(isSuperAdminOrAdmin).toHaveBeenCalled();
    expect(diagnosticController.getDiagnosticLogById).toHaveBeenCalled();
  });
});
