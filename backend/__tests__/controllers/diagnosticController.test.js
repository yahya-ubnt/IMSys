const {
  runDiagnostic,
  getDiagnosticHistory,
  getDiagnosticLogById,
} = require('../../controllers/diagnosticController');
const DiagnosticService = require('../../services/DiagnosticService');
const { validationResult } = require('express-validator');

jest.mock('../../services/DiagnosticService');
jest.mock('express-validator');

describe('Diagnostic Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { userId: 'testUser', logId: 'testLog' },
      user: { tenant: 'testTenant' },
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
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runDiagnostic', () => {
    it('should run diagnostic with streaming', async () => {
      req.body.stream = true;
      DiagnosticService.runDiagnostic.mockResolvedValue();

      await runDiagnostic(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();
      expect(DiagnosticService.runDiagnostic).toHaveBeenCalledWith('testUser', 'testTenant', expect.any(Function));
    });

    it('should run diagnostic without streaming', async () => {
        req.body.stream = false;
        const mockLog = { id: 'log1', message: 'Diagnostic complete' };
        DiagnosticService.runDiagnostic.mockResolvedValue(mockLog);
    
        await runDiagnostic(req, res);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockLog);
        expect(DiagnosticService.runDiagnostic).toHaveBeenCalledWith('testUser', 'testTenant');
      });
  });

  describe('getDiagnosticHistory', () => {
    it('should return diagnostic history', async () => {
      const mockLogs = [{ id: 'log1' }, { id: 'log2' }];
      DiagnosticService.getDiagnosticHistory.mockResolvedValue(mockLogs);

      await getDiagnosticHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLogs);
      expect(DiagnosticService.getDiagnosticHistory).toHaveBeenCalledWith('testUser', 'testTenant');
    });

    it('should return 400 if validation fails', async () => {
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });
  
        await getDiagnosticHistory(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
      });
  });

  describe('getDiagnosticLogById', () => {
    it('should return a single diagnostic log', async () => {
      const mockLog = { id: 'log1' };
      DiagnosticService.getDiagnosticLogById.mockResolvedValue(mockLog);

      await getDiagnosticLogById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLog);
      expect(DiagnosticService.getDiagnosticLogById).toHaveBeenCalledWith('testLog', 'testUser', 'testTenant');
    });

    it('should return 400 if validation fails', async () => {
        validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });
  
        await getDiagnosticLogById(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
      });
  });
});