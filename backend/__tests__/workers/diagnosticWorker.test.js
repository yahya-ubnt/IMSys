
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const Device = require('../../models/Device');
const { verifyRootCause } = require('../../services/DiagnosticService');
const { sendConsolidatedAlert } = require('../../services/alertingService');

// Mock dependencies
jest.mock('bullmq');
jest.mock('../../config/db', () => jest.fn());
jest.mock('../../models/Device');
jest.mock('../../services/DiagnosticService');
jest.mock('../../services/alertingService');

let jobProcessor;

// Capture the job processing function
Worker.mockImplementation((queueName, processor) => {
  jobProcessor = processor;
});

// Require the worker file to initialize it
require('../../workers/diagnosticWorker');

describe('Diagnostic Worker', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process a job, find a root cause, and send an alert', async () => {
    const deviceId = new mongoose.Types.ObjectId();
    const tenantId = new mongoose.Types.ObjectId();
    const mockDevice = { _id: deviceId, deviceName: 'Test Device', tenant: tenantId };
    const mockRootCause = { deviceName: 'Root Cause Device' };

    Device.findById.mockResolvedValue(mockDevice);
    verifyRootCause.mockResolvedValue({ rootCause: mockRootCause });

    const job = { data: { deviceId } };
    await jobProcessor(job);

    expect(Device.findById).toHaveBeenCalledWith(deviceId);
    expect(verifyRootCause).toHaveBeenCalledWith(deviceId, tenantId);
    expect(sendConsolidatedAlert).toHaveBeenCalledWith([mockRootCause], 'DOWN (Root Cause)', tenantId, null, 'Device');
  });

  it('should process a job and not send an alert if no root cause is found', async () => {
    const deviceId = new mongoose.Types.ObjectId();
    const tenantId = new mongoose.Types.ObjectId();
    const mockDevice = { _id: deviceId, deviceName: 'Test Device', tenant: tenantId };

    Device.findById.mockResolvedValue(mockDevice);
    verifyRootCause.mockResolvedValue({ rootCause: null });

    const job = { data: { deviceId } };
    await jobProcessor(job);

    expect(Device.findById).toHaveBeenCalledWith(deviceId);
    expect(verifyRootCause).toHaveBeenCalledWith(deviceId, tenantId);
    expect(sendConsolidatedAlert).not.toHaveBeenCalled();
  });

  it('should throw an error if the device is not found', async () => {
    const deviceId = new mongoose.Types.ObjectId();
    Device.findById.mockResolvedValue(null);

    const job = { data: { deviceId } };
    await expect(jobProcessor(job)).rejects.toThrow(`Device with ID ${deviceId} not found.`);
  });

  it('should throw an error if verifyRootCause fails', async () => {
    const deviceId = new mongoose.Types.ObjectId();
    const tenantId = new mongoose.Types.ObjectId();
    const mockDevice = { _id: deviceId, deviceName: 'Test Device', tenant: tenantId };
    const errorMessage = 'Verification Failed';

    Device.findById.mockResolvedValue(mockDevice);
    verifyRootCause.mockRejectedValue(new Error(errorMessage));

    const job = { data: { deviceId } };
    await expect(jobProcessor(job)).rejects.toThrow(errorMessage);
  });
});
