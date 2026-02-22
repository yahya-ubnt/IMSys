
const { Queue } = require('bullmq');
const diagnosticQueue = require('../../queues/diagnosticQueue');

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    // Mock any methods used on the queue instance if necessary
  })),
}));

describe('Diagnostic Queue', () => {
  it('should instantiate the diagnostic queue with correct name and Redis connection', () => {
    expect(Queue).toHaveBeenCalledWith('diagnostic-queue', {
      connection: {
        host: 'redis',
        port: 6379,
      },
    });
    expect(diagnosticQueue).toBeDefined();
  });
});
