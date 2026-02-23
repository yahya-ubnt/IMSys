const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  runDiagnostic,
  getDiagnosticHistory,
  getDiagnosticLogById,
} = require('../../controllers/diagnosticController');
const Tenant = require('../../models/Tenant');

// Mock DiagnosticService
jest.mock('../../services/DiagnosticService');
const DiagnosticService = require('../../services/DiagnosticService');

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

describe('Diagnostic Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Tenant.deleteMany({});
    tenant = await Tenant.create({ name: 'Diag Tenant' });

    req = {
      params: { userId: 'user123' },
      user: { tenant: tenant._id },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('runDiagnostic', () => {
    it('should call DiagnosticService.runDiagnostic for non-streaming', async () => {
      req.body = { stream: false };
      DiagnosticService.runDiagnostic.mockResolvedValue({ status: 'completed' });

      await runDiagnostic(req, res, next);

      expect(DiagnosticService.runDiagnostic).toHaveBeenCalledWith('user123', tenant._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should set headers for streaming', async () => {
        req.body = { stream: true };
        // We don't want to actually run the async service logic fully here
        DiagnosticService.runDiagnostic.mockImplementation(() => new Promise(() => {}));

        await runDiagnostic(req, res, next);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    });
  });

  describe('getDiagnosticHistory', () => {
      it('should return logs from DiagnosticService', async () => {
          DiagnosticService.getDiagnosticHistory.mockResolvedValue([{ _id: 'log1' }]);
          await getDiagnosticHistory(req, res, next);
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith([{ _id: 'log1' }]);
      });
  });
});
